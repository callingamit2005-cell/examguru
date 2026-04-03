/**
 * razorpay.js — Razorpay Configuration
 * 
 * Switch modes via .env:
 *   PAYMENT_MODE=test  → test keys (development)
 *   PAYMENT_MODE=live  → live keys (production)
 */
const Razorpay = require("razorpay");

const MODE   = process.env.PAYMENT_MODE || "test";
const isLive = MODE === "live";

const KEY_ID         = isLive ? process.env.RAZORPAY_LIVE_KEY_ID         : process.env.RAZORPAY_TEST_KEY_ID;
const KEY_SECRET     = isLive ? process.env.RAZORPAY_LIVE_KEY_SECRET      : process.env.RAZORPAY_TEST_KEY_SECRET;
const WEBHOOK_SECRET = isLive ? process.env.RAZORPAY_LIVE_WEBHOOK_SECRET  : process.env.RAZORPAY_TEST_WEBHOOK_SECRET;

if (!KEY_ID || KEY_ID.includes("your_")) {
  console.warn(`⚠️  Razorpay ${MODE.toUpperCase()} keys not set in .env — payment will fail`);
} else {
  console.log(`💳 Razorpay: ${isLive ? "🟢 LIVE MODE" : "🟡 TEST MODE"}`);
}

const razorpay = new Razorpay({ key_id: KEY_ID || "invalid", key_secret: KEY_SECRET || "invalid" });

module.exports = { razorpay, KEY_ID, KEY_SECRET, WEBHOOK_SECRET, isLive, MODE };
