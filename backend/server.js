/**
 * server.js — ExamGuru AI Backend
 * 
 * Security layers:
 * 1. Helmet — HTTP security headers
 * 2. CORS — restricted to allowed origins
 * 3. Rate limiting — per-route limits
 * 4. Input sanitization — trim + length limits
 * 5. Error handler — no stack traces in production
 * 6. Request logging — morgan (dev) / minimal (prod)
 */

require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const helmet  = require("helmet");

const isProd = process.env.NODE_ENV === "production";

// ─── App ──────────────────────────────────────────────────────────────────────
const app = express();

// ─── Security Headers (Helmet) ────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // API-only, no HTML served
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://examguru.vercel.app",    // update when deployed
  "https://examguru.ai",            // update when domain ready
  /capacitor:\/\//,                 // Capacitor Android/iOS
  /file:\/\//,                      // Capacitor local files
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin (mobile apps, Postman)
    if (!origin) return cb(null, true);
    const allowed = ALLOWED_ORIGINS.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    );
    if (allowed || !isProd) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
  credentials: true,
}));

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(isProd ? "combined" : "dev"));

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const hits = new Map();

function makeRateLimit(maxPerMin, label = "") {
  return function rateLimit(req, res, next) {
    const key = (req.ip || "x") + "|" + label;
    const now = Date.now();
    const h   = hits.get(key);
    if (!h || now - h.start > 60000) {
      hits.set(key, { count: 1, start: now });
      return next();
    }
    if (h.count >= maxPerMin) {
      return res.status(429).json({
        error: "Too many requests. Please slow down.",
        retryAfter: Math.ceil((60000 - (now - h.start)) / 1000),
      });
    }
    h.count++;
    next();
  };
}

// Cleanup old entries every 2 min
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits.entries()) {
    if (now - v.start > 120000) hits.delete(k);
  }
}, 120000);

const limitChat    = makeRateLimit(60,  "chat");    // 60/min per IP
const limitTest    = makeRateLimit(20,  "test");    // 20/min per IP
const limitScan    = makeRateLimit(10,  "scan");    // 10/min (Gemini expensive)
const limitPayment = makeRateLimit(10,  "payment"); // 10/min
const limitGeneral = makeRateLimit(120, "general"); // 120/min default

// ─── Response Cache (GET only) ────────────────────────────────────────────────
const responseCache = new Map();
const CACHE_TTL = 45000; // 45s

function cacheGet(req, res, next) {
  if (req.method !== "GET") return next();
  const key = req.originalUrl + "|" + (req.user?.id || "anon");
  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return res.json(hit.data);
  const orig = res.json.bind(res);
  res.json = (data) => { responseCache.set(key, { data, ts: Date.now() }); return orig(data); };
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of responseCache.entries()) {
    if (now - v.ts > CACHE_TTL * 3) responseCache.delete(k);
  }
}, 120000);

// ─── Input Sanitizer ──────────────────────────────────────────────────────────
function sanitize(req, res, next) {
  // Trim all string fields + enforce max lengths
  const sanitizeObj = (obj, depth = 0) => {
    if (depth > 3 || !obj || typeof obj !== "object") return;
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === "string") {
        obj[k] = obj[k].trim().slice(0, 10000); // max 10k chars
      } else if (typeof obj[k] === "object") {
        sanitizeObj(obj[k], depth + 1);
      }
    }
  };
  if (req.body) sanitizeObj(req.body);
  next();
}

app.use(sanitize);

// ─── Routes ───────────────────────────────────────────────────────────────────
const chatRoutes     = require("./routes/chat");
const userRoutes     = require("./routes/user");
const testRoutes     = require("./routes/test");
const analyticsRoutes= require("./routes/analytics");
const scanRoutes     = require("./routes/scan");
const adminRoutes    = require("./routes/admin");
const diagramRoutes  = require("./routes/diagram");
const paymentRoutes  = require("./routes/payment");
const contentRoutes  = require("./routes/content");

app.use("/api/chat",      limitChat,    chatRoutes);
app.use("/api/user",      limitGeneral, cacheGet, userRoutes);
app.use("/api/test",      limitTest,    testRoutes);
app.use("/api/analytics", limitGeneral, cacheGet, analyticsRoutes);
app.use("/api/scan",      limitScan,    scanRoutes);
app.use("/api/admin",     limitGeneral, adminRoutes);
app.use("/api/diagram",   limitGeneral, diagramRoutes);
app.use("/api/payment",   limitPayment, paymentRoutes);
app.use("/api/content",   limitGeneral, contentRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({
  status:  "ok",
  uptime:  Math.floor(process.uptime()),
  env:     isProd ? "production" : "development",
  version: "1.0.0",
}));

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`❌ [${status}] ${req.method} ${req.path} — ${err.message}`);
  res.status(status).json({
    error: isProd ? "Something went wrong" : err.message,
    // Never expose stack traces in production
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ExamGuru AI Server: http://localhost:${PORT}`);
  console.log(`🔒 Security: Helmet + CORS + Rate limits active`);
  console.log(`🌍 Mode: ${isProd ? "PRODUCTION" : "development"}`);
});
