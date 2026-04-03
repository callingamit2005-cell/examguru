/**
 * payment.js — Razorpay Payment Routes
 * 
 * POST /api/payment/create-order  → Create Razorpay order
 * POST /api/payment/verify        → Verify payment signature
 * POST /api/payment/webhook       → Razorpay webhook
 * GET  /api/payment/status/:uid   → Check premium status
 * POST /api/payment/start-trial   → Activate 7-day free trial
 * GET  /api/payment/mode          → Check test/live mode (dev only)
 */

const express  = require("express");
const router   = express.Router();
const crypto   = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { razorpay, KEY_ID, WEBHOOK_SECRET, isLive, MODE } = require("../config/razorpay");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = {
  monthly: {
    amount:      9900,      // ₹99 in paise
    currency:    "INR",
    description: "ExamGuru AI Monthly — ₹99/month",
    durationDays: 30,
  },
  yearly: {
    amount:      89900,     // ₹899 in paise
    currency:    "INR",
    description: "ExamGuru AI Yearly — ₹899/year",
    durationDays: 365,
  },
};

// ─── GET /mode — shows current mode (useful for debugging) ───────────────────
router.get("/mode", (req, res) => {
  res.json({ mode: MODE, isLive, keyPrefix: KEY_ID?.slice(0,12) + "..." });
});

// ─── POST /create-order ───────────────────────────────────────────────────────
router.post("/create-order", async (req, res, next) => {
  try {
    const { userId, plan = "monthly", email = "", name = "" } = req.body;
    if (!userId)      return res.status(400).json({ error: "userId required" });
    if (!PLANS[plan]) return res.status(400).json({ error: "Invalid plan. Use: monthly | yearly" });

    const p = PLANS[plan];

    const order = await razorpay.orders.create({
      amount:   p.amount,
      currency: p.currency,
      receipt:  `rcpt_${userId.slice(0,8)}_${Date.now()}`,
      notes:    { userId, plan, email, name },
    });

    // Save pending payment
    await supabase.from("payments").upsert({
      user_id:    userId,
      order_id:   order.id,
      plan,
      amount:     p.amount,
      currency:   p.currency,
      status:     "pending",
      created_at: new Date().toISOString(),
    }, { onConflict: "order_id" });

    res.json({
      orderId:     order.id,
      amount:      p.amount,
      currency:    p.currency,
      keyId:       KEY_ID,
      plan,
      description: p.description,
      mode:        MODE,
      prefill:     { name, email },
    });
  } catch (err) {
    console.error("create-order error:", err.message);
    next(err);
  }
});

// ─── POST /verify ─────────────────────────────────────────────────────────────
router.post("/verify", async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment fields" });
    }

    // Verify HMAC signature
    const { KEY_SECRET } = require("../config/razorpay");
    const expectedSig = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature — possible fraud attempt" });
    }

    // Calculate expiry
    const now    = new Date();
    const expiry = new Date(now);
    const days   = PLANS[plan]?.durationDays || 30;
    expiry.setDate(expiry.getDate() + days);

    // Update payment record
    await supabase.from("payments").update({
      payment_id: razorpay_payment_id,
      status:     "paid",
      paid_at:    now.toISOString(),
    }).eq("order_id", razorpay_order_id);

    // Activate premium
    await supabase.from("users").update({
      is_premium:     true,
      premium_plan:   plan,
      premium_start:  now.toISOString(),
      premium_expiry: expiry.toISOString(),
      trial_used:     true,
    }).eq("id", userId);

    console.log(`✅ Payment verified: ${razorpay_payment_id} | User: ${userId} | Plan: ${plan}`);

    res.json({
      success: true,
      plan,
      expiry:  expiry.toISOString(),
      daysLeft: days,
      message: `Payment successful! ${plan === "yearly" ? "Yearly" : "Monthly"} Premium activated 🎉`,
    });
  } catch (err) {
    console.error("verify error:", err.message);
    next(err);
  }
});

// ─── POST /webhook ────────────────────────────────────────────────────────────
// Set this URL in Razorpay Dashboard → Webhooks
// URL: https://your-domain.com/api/payment/webhook
router.post("/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const sig      = req.headers["x-razorpay-signature"];
      const expected = crypto
        .createHmac("sha256", WEBHOOK_SECRET || "")
        .update(req.body)
        .digest("hex");

      if (sig !== expected) {
        console.warn("⚠️  Invalid webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      const event = JSON.parse(req.body.toString());
      console.log(`📦 Webhook: ${event.event}`);

      // Payment captured
      if (event.event === "payment.captured") {
        const payment = event.payload.payment.entity;
        const notes   = payment.notes || {};
        const userId  = notes.userId;
        const plan    = notes.plan || "monthly";

        if (userId) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + (PLANS[plan]?.durationDays || 30));
          await supabase.from("users").update({
            is_premium:     true,
            premium_plan:   plan,
            premium_expiry: expiry.toISOString(),
          }).eq("id", userId);
          console.log(`✅ Webhook premium activated: ${userId}`);
        }
      }

      // Payment failed
      if (event.event === "payment.failed") {
        const payment = event.payload.payment.entity;
        await supabase.from("payments").update({ status: "failed" })
          .eq("order_id", payment.order_id);
      }

      res.json({ status: "ok" });
    } catch (err) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: "Webhook failed" });
    }
  }
);

// ─── GET /status/:userId ──────────────────────────────────────────────────────
router.get("/status/:userId", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("is_premium, premium_plan, premium_start, premium_expiry, trial_used")
      .eq("id", req.params.userId)
      .single();

    if (error) throw error;

    const now      = new Date();
    const expiry   = data?.premium_expiry ? new Date(data.premium_expiry) : null;
    const isActive = data?.is_premium && expiry && expiry > now;
    const daysLeft = expiry ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : 0;

    res.json({
      isPremium:  isActive || false,
      plan:       isActive ? (data.premium_plan || "monthly") : "free",
      expiry:     data?.premium_expiry || null,
      daysLeft,
      trialUsed:  data?.trial_used || false,
    });
  } catch (err) { next(err); }
});

// ─── POST /start-trial ────────────────────────────────────────────────────────
router.post("/start-trial", async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    const { data } = await supabase
      .from("users")
      .select("trial_used, is_premium")
      .eq("id", userId)
      .single();

    if (data?.trial_used)  return res.status(400).json({ error: "Trial already used for this account" });
    if (data?.is_premium)  return res.status(400).json({ error: "Already a premium member" });

    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + 7);

    await supabase.from("users").update({
      is_premium:     true,
      premium_plan:   "trial",
      premium_start:  new Date().toISOString(),
      premium_expiry: trialExpiry.toISOString(),
      trial_used:     true,
    }).eq("id", userId);

    res.json({
      success: true,
      expiry:  trialExpiry.toISOString(),
      daysLeft: 7,
      message: "7-day free trial activated! 🎉",
    });
  } catch (err) { next(err); }
});

module.exports = router;
