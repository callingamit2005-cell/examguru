require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

// ─── Simple request cache ─────────────────────────────────────────────────────
const responseCache = new Map();
const CACHE_TTL = 45000; // 45 sec

function cacheGet(req, res, next) {
  if (req.method !== "GET") return next();
  const key = req.originalUrl;
  const hit = responseCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return res.json(hit.data);
  }
  const orig = res.json.bind(res);
  res.json = function(data) {
    responseCache.set(key, { data, ts: Date.now() });
    return orig(data);
  };
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of responseCache.entries()) {
    if (now - v.ts > CACHE_TTL * 3) responseCache.delete(k);
  }
}, 120000);

// ─── Simple rate limiter ──────────────────────────────────────────────────────
const hits = new Map();
function rateLimit(req, res, next) {
  const key = (req.ip || "x") + req.path;
  const now = Date.now();
  const h = hits.get(key);
  if (!h || now - h.start > 60000) {
    hits.set(key, { count: 1, start: now });
    return next();
  }
  if (h.count >= 300) { // 300 req/min per path — very lenient
    return res.status(429).json({ error: "Too many requests" });
  }
  h.count++;
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits.entries()) {
    if (now - v.start > 120000) hits.delete(k);
  }
}, 120000);

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*", methods: ["GET","POST","PUT","DELETE","OPTIONS"] }));
app.use(express.json({ limit: "20mb" }));
app.use(morgan("dev"));

// ─── Routes ───────────────────────────────────────────────────────────────────
const chatRoutes     = require("./routes/chat");
const userRoutes     = require("./routes/user");
const testRoutes     = require("./routes/test");
const analyticsRoutes= require("./routes/analytics");
const scanRoutes     = require("./routes/scan");
const adminRoutes    = require("./routes/admin");
const diagramRoutes  = require("./routes/diagram");

app.use("/api/chat",      chatRoutes);
app.use("/api/user",      cacheGet, userRoutes);
app.use("/api/test",      testRoutes);
app.use("/api/analytics", cacheGet, analyticsRoutes);
app.use("/api/scan",      scanRoutes);
app.use("/api/admin",     adminRoutes);
app.use("/api/diagram",    diagramRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ExamGuru AI Server running on http://localhost:${PORT}`);
  console.log(`🍃 Database: Supabase (PostgreSQL)`);
  console.log(`🤖 AI: Groq + Claude Vision`);
});
