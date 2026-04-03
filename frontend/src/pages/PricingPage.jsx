/**
 * PricingPage.jsx
 * 
 * Razorpay payment integration
 * Plans: Monthly ₹99 | Yearly ₹899 | 7-day free trial
 * 
 * Flow:
 * 1. User clicks plan → backend creates order
 * 2. Razorpay checkout opens
 * 3. On success → backend verifies → premium activated
 */

import React, { useState, useEffect } from "react";
import { useUser } from "../hooks/useUser";
import API from "../utils/api";

const PLANS = [
  {
    id:          "monthly",
    name:        "Monthly",
    price:       "₹99",
    period:      "/month",
    originalPrice:"₹199",
    badge:       null,
    color:       "#3b82f6",
    features:    [
      "✅ Unlimited AI Tutor sessions",
      "✅ Unlimited Mock Tests",
      "✅ All 67 Exam courses",
      "✅ Photo Scanner (unlimited)",
      "✅ NCERT Chapter Practice",
      "✅ Progress Reports",
      "✅ Group Study Rooms",
      "✅ Peer Challenges",
      "✅ Priority Support",
    ],
  },
  {
    id:          "yearly",
    name:        "Yearly",
    price:       "₹899",
    period:      "/year",
    originalPrice:"₹1,188",
    badge:       "🔥 BEST VALUE — Save ₹289!",
    color:       "#10b981",
    features:    [
      "✅ Everything in Monthly",
      "✅ 2 months FREE",
      "✅ Early access to new features",
      "✅ Downloadable study material",
      "✅ Parent dashboard premium",
      "✅ Exam prediction AI (advanced)",
      "✅ Badge & leaderboard priority",
    ],
  },
];

const FREE_FEATURES = [
  "❌ Limited to 5 AI questions/day",
  "❌ 2 mock tests/month",
  "❌ Basic photo scan (3/day)",
  "❌ No group study",
  "❌ No progress reports",
];

export default function PricingPage({ onNavigate }) {
  const { user, refreshUser } = useUser();
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [loading, setLoading]             = useState(false);
  const [activePlan, setActivePlan]       = useState("yearly");
  const [trialLoading, setTrialLoading]   = useState(false);
  const [successMsg, setSuccessMsg]       = useState("");
  const [scriptLoaded, setScriptLoaded]   = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const s = document.querySelector('script[src*="razorpay"]');
    if (s) { setScriptLoaded(true); return; }
    const script    = document.createElement("script");
    script.src      = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload   = () => setScriptLoaded(true);
    script.onerror  = () => console.error("Razorpay script load failed");
    document.body.appendChild(script);
  }, []);

  const [paymentMode, setPaymentMode] = useState("test");

  // Check existing premium status + payment mode
  useEffect(() => {
    if (!user?.id) return;
    API.get(`/payment/status/${user.id}`)
      .then(r => setPremiumStatus(r.data))
      .catch(() => setPremiumStatus({ isPremium:false, plan:"free" }));
    // Check test/live mode
    API.get("/payment/mode")
      .then(r => setPaymentMode(r.data.mode))
      .catch(() => {});
  }, [user?.id]);

  const startTrial = async () => {
    if (!user?.id) return;
    setTrialLoading(true);
    try {
      const res = await API.post("/payment/start-trial", { userId: user.id });
      setSuccessMsg("🎉 7-day Free Trial activated! Enjoy all premium features!");
      setPremiumStatus({ isPremium:true, plan:"trial", daysLeft:7 });
      setTimeout(() => { refreshUser && refreshUser(user.id); onNavigate?.("dashboard"); }, 2000);
    } catch(e) {
      alert(e?.response?.data?.error || "Trial already used or error occurred.");
    } finally { setTrialLoading(false); }
  };

  const startPayment = async (planId) => {
    if (!user?.id) return;
    if (!scriptLoaded) { alert("Payment system loading... please wait."); return; }
    setLoading(true);
    try {
      // 1. Create order on backend
      const { data } = await API.post("/payment/create-order", {
        userId: user.id,
        plan:   planId,
        email:  user.email,
        name:   user.name,
      });

      // 2. Open Razorpay checkout
      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        "ExamGuru AI",
        description: data.description,
        order_id:    data.orderId,
        image:       "/icon-192.png",
        prefill: {
          name:  data.prefill?.name  || user.name,
          email: data.prefill?.email || user.email,
        },
        theme: { color: "#3b82f6" },
        modal: {
          ondismiss: () => { setLoading(false); }
        },
        handler: async (response) => {
          // 3. Verify payment on backend
          try {
            const verify = await API.post("/payment/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userId: user.id,
              plan:   planId,
            });
            setSuccessMsg(`🎉 Payment Successful! ${planId === "yearly" ? "Yearly" : "Monthly"} Premium activated!`);
            setPremiumStatus({ isPremium:true, plan:planId, daysLeft: planId==="yearly"?365:30 });
            setTimeout(() => { refreshUser && refreshUser(user.id); onNavigate?.("dashboard"); }, 2500);
          } catch(e) {
            alert("Payment verify failed. Contact support with Payment ID: " + response.razorpay_payment_id);
          } finally { setLoading(false); }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch(e) {
      alert("Payment initiation failed: " + (e?.response?.data?.error || e.message));
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successMsg) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100vh", padding:"24px", textAlign:"center" }}>
      <div style={{ fontSize:"80px", marginBottom:"16px" }}>🎉</div>
      <h2 style={{ fontSize:"24px", fontWeight:900, marginBottom:"8px", color:"#10b981" }}>Payment Successful!</h2>
      <p style={{ fontSize:"16px", color:"var(--text-secondary)", marginBottom:"24px" }}>{successMsg}</p>
      <div className="loader" style={{ width:"24px", height:"24px" }}/>
      <p style={{ fontSize:"13px", color:"var(--text-muted)", marginTop:"12px" }}>Dashboard pe redirect ho raha hai...</p>
    </div>
  );

  // ── Already Premium screen ──────────────────────────────────────────────────
  if (premiumStatus?.isPremium && premiumStatus?.plan !== "trial") return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      <div className="card fade-in" style={{ textAlign:"center", padding:"40px", maxWidth:"500px", margin:"60px auto",
        background:"linear-gradient(135deg,rgba(16,185,129,0.1),rgba(16,185,129,0.03))",
        borderColor:"rgba(16,185,129,0.3)" }}>
        <div style={{ fontSize:"60px", marginBottom:"16px" }}>👑</div>
        <h2 style={{ fontSize:"22px", fontWeight:900, marginBottom:"8px", color:"#10b981" }}>You're Premium!</h2>
        <p style={{ fontSize:"14px", color:"var(--text-secondary)", marginBottom:"16px" }}>
          Plan: <strong>{premiumStatus.plan === "yearly" ? "Yearly ₹899" : "Monthly ₹99"}</strong>
        </p>
        <p style={{ fontSize:"13px", color:"var(--text-muted)", marginBottom:"20px" }}>
          {premiumStatus.daysLeft} days remaining
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate?.("dashboard")}
          style={{ justifyContent:"center", padding:"12px 24px" }}>
          → Dashboard pe jao
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding:"24px", overflowY:"auto", maxHeight:"100vh" }}>
      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:"32px" }}>
        <div style={{ fontSize:"40px", marginBottom:"8px" }}>🎓</div>
        <h1 style={{ fontSize:"28px", fontWeight:900, marginBottom:"8px" }}>ExamGuru AI Premium</h1>
        <p style={{ fontSize:"15px", color:"var(--text-secondary)", maxWidth:"480px", margin:"0 auto" }}>
          India's smartest AI tutor — Class 6 se UPSC tak. Unlimited padhai, unlimited success! 🚀
        </p>
      </div>

      {/* Trial banner — show only if trial not used */}
      {!premiumStatus?.trialUsed && !premiumStatus?.isPremium && (
        <div style={{ maxWidth:"700px", margin:"0 auto 24px", padding:"16px 20px",
          background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(251,191,36,0.06))",
          border:"1px solid rgba(245,158,11,0.4)", borderRadius:"14px",
          display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:"200px" }}>
            <div style={{ fontSize:"16px", fontWeight:900, marginBottom:"4px" }}>🎁 7-Day FREE Trial</div>
            <div style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
              Pehle try karo — baad mein subscribe karo. Koi card required nahi!
            </div>
          </div>
          <button onClick={startTrial} disabled={trialLoading}
            style={{ padding:"12px 24px", borderRadius:"10px", border:"none",
              background:"linear-gradient(135deg,#f59e0b,#fbbf24)",
              color:"#000", fontWeight:900, fontSize:"14px", cursor:"pointer",
              fontFamily:"var(--font-main)", flexShrink:0 }}>
            {trialLoading ? <><div className="loader" style={{width:"14px",height:"14px",display:"inline-block",marginRight:"6px"}}/>Activating...</> : "🎁 Free Trial Shuru Karo"}
          </button>
        </div>
      )}

      {/* Pricing cards */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", maxWidth:"700px", margin:"0 auto 32px" }}>
        {PLANS.map(plan => (
          <div key={plan.id} onClick={() => setActivePlan(plan.id)}
            style={{ borderRadius:"18px", padding:"28px 24px", cursor:"pointer",
              border:`2px solid ${activePlan===plan.id?plan.color:"var(--border)"}`,
              background: activePlan===plan.id?`${plan.color}0a`:"var(--bg-card)",
              transition:"all 0.2s", position:"relative", overflow:"hidden" }}>

            {plan.badge && (
              <div style={{ position:"absolute", top:0, left:0, right:0, padding:"6px",
                background:`linear-gradient(135deg,${plan.color},${plan.color}cc)`,
                textAlign:"center", fontSize:"11px", fontWeight:900, color:"white" }}>
                {plan.badge}
              </div>
            )}

            <div style={{ marginTop: plan.badge?"28px":"0" }}>
              <div style={{ fontSize:"16px", fontWeight:800, marginBottom:"8px" }}>{plan.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"4px" }}>
                <span style={{ fontSize:"36px", fontWeight:900, color:plan.color }}>{plan.price}</span>
                <span style={{ fontSize:"14px", color:"var(--text-muted)" }}>{plan.period}</span>
              </div>
              <div style={{ fontSize:"12px", color:"var(--text-muted)", textDecoration:"line-through", marginBottom:"16px" }}>
                Was {plan.originalPrice}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {plan.features.map((f,i) => (
                  <div key={i} style={{ fontSize:"12px", color:"var(--text-secondary)" }}>{f}</div>
                ))}
              </div>
            </div>

            {activePlan===plan.id && (
              <div style={{ position:"absolute", top:"12px", right:"12px", width:"20px", height:"20px",
                borderRadius:"50%", background:plan.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"12px", color:"white", fontWeight:900 }}>✓</div>
            )}
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <div style={{ maxWidth:"700px", margin:"0 auto 24px", textAlign:"center" }}>
        <button onClick={() => startPayment(activePlan)} disabled={loading}
          style={{ padding:"16px 48px", borderRadius:"14px", border:"none",
            background:activePlan==="yearly"
              ?"linear-gradient(135deg,#10b981,#059669)"
              :"linear-gradient(135deg,#3b82f6,#2563eb)",
            color:"white", fontWeight:900, fontSize:"16px", cursor:"pointer",
            fontFamily:"var(--font-main)", width:"100%", maxWidth:"400px",
            boxShadow:activePlan==="yearly"?"0 8px 24px rgba(16,185,129,0.3)":"0 8px 24px rgba(59,130,246,0.3)",
            transition:"all 0.2s" }}>
          {loading
            ? <><div className="loader" style={{width:"16px",height:"16px",display:"inline-block",marginRight:"8px"}}/>Processing...</>
            : activePlan==="yearly"
              ? "🚀 ₹899/year — Subscribe Karo"
              : "💳 ₹99/month — Subscribe Karo"}
        </button>

        {/* Trust badges */}
        <div style={{ display:"flex", justifyContent:"center", gap:"20px", marginTop:"16px", flexWrap:"wrap" }}>
          {["🔒 100% Secure", "↩️ 7-day Refund", "📱 UPI / Cards / NetBanking", "🏦 Razorpay Secured"].map((t,i) => (
            <div key={i} style={{ fontSize:"11px", color:"var(--text-muted)", fontWeight:600 }}>{t}</div>
          ))}
        </div>
      </div>

      {/* Free vs Premium comparison */}
      <div style={{ maxWidth:"700px", margin:"0 auto 32px" }}>
        <div className="card">
          <h3 style={{ fontSize:"14px", fontWeight:800, marginBottom:"14px", textAlign:"center" }}>
            Free vs Premium — Kya milega?
          </h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:800, color:"var(--text-muted)", marginBottom:"8px" }}>
                🆓 FREE PLAN
              </div>
              {FREE_FEATURES.map((f,i) => (
                <div key={i} style={{ fontSize:"12px", color:"var(--text-muted)", padding:"4px 0", borderBottom:"1px solid var(--border)" }}>{f}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:"12px", fontWeight:800, color:"#10b981", marginBottom:"8px" }}>
                👑 PREMIUM PLAN
              </div>
              {PLANS[0].features.map((f,i) => (
                <div key={i} style={{ fontSize:"12px", color:"var(--text-secondary)", padding:"4px 0", borderBottom:"1px solid var(--border)" }}>{f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth:"700px", margin:"0 auto" }}>
        <h3 style={{ fontSize:"16px", fontWeight:800, marginBottom:"16px", textAlign:"center" }}>❓ FAQ</h3>
        {[
          ["Payment kaise karu?", "Razorpay secure checkout use hoga — UPI (PhonePe/GPay), Credit/Debit Card, Net Banking sab supported hai."],
          ["7-day trial mein kya milega?", "Poora Premium access milega — koi restriction nahi. Card details bhi nahi chahiye trial ke liye!"],
          ["Agar pasand na aaye to?", "7 din ke andar full refund milega. Support pe contact karo."],
          ["Ek se zyada device pe use kar sakte hain?", "Haan! Same account se phone, tablet, laptop — sab pe access milega."],
          ["Cancel kaise karein?", "Koi bhi time cancel kar sakte ho. Next billing cycle se charge nahi hoga."],
        ].map(([q,a],i) => (
          <div key={i} className="card" style={{ marginBottom:"8px", padding:"14px 16px" }}>
            <div style={{ fontSize:"13px", fontWeight:800, marginBottom:"6px" }}>Q: {q}</div>
            <div style={{ fontSize:"12px", color:"var(--text-secondary)" }}>A: {a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
