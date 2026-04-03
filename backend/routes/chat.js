const express = require("express");
const diagramCache = new Map(); // Simple in-memory cache for diagrams
const { getDB } = require("../db/database");
const { getChatResponse, detectConfusion, getReExplanation, getExaminerThinking, getWhyStudyThis, getMultiTeacherExplanation, generateSVGDiagram } = require("../controllers/aiController");

const router = express.Router();

router.post("/message", async (req, res, next) => {
  try {
    const { userId, sessionId, message, examType, subject } = req.body;
    if (!userId || !message || !examType || !subject)
      return res.status(400).json({ error: "userId, message, examType, subject are required" });

    const db = getDB();

    // Create session if needed
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const { data: session, error } = await db.from("sessions")
        .insert({ user_id: userId, subject, exam_type: examType })
        .select().single();
      if (error) throw new Error(error.message);
      activeSessionId = session.id;
    }

    // Save user message
    await db.from("messages").insert({
      session_id: activeSessionId, user_id: userId, role: "user", content: message, subject
    });

    // Get history (last 10 messages only - prevents context pollution)
    const { data: history } = await db.from("messages")
      .select("role, content, subject").eq("session_id", activeSessionId)
      .order("created_at", { ascending: true }).limit(20);
    
    // Filter to only same-subject messages to prevent cross-topic confusion
    const filteredHistory = (history || []).filter(m => 
      !m.subject || m.subject === subject || m.role === "user"
    ).slice(-10); // last 10 only

    // Get weak topics
    const { data: weakTopics } = await db.from("weak_topics")
      .select("topic").eq("user_id", userId).eq("exam_type", examType).eq("subject", subject)
      .order("wrong_count", { ascending: false }).limit(5);

    const aiResponse = await getChatResponse(filteredHistory, examType, subject, weakTopics || []);

    // Save AI response
    await db.from("messages").insert({
      session_id: activeSessionId, user_id: userId, role: "assistant", content: aiResponse, subject
    });

    // Update last_active
    await db.from("users").update({ last_active: new Date().toISOString() }).eq("id", userId);

    res.json({ sessionId: activeSessionId, response: aiResponse });
  } catch (err) { next(err); }
});

router.get("/history/:sessionId", async (req, res, next) => {
  try {
    const { data: messages, error } = await getDB().from("messages")
      .select("id, role, content, created_at")
      .eq("session_id", req.params.sessionId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    res.json({ messages: messages || [] });
  } catch (err) { next(err); }
});

router.get("/sessions/:userId", async (req, res, next) => {
  try {
    const db = getDB();
    const { data: sessions, error } = await db.from("sessions")
      .select("id, subject, exam_type, created_at")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false }).limit(20);
    if (error) throw new Error(error.message);

    // Get message counts
    const sessionsWithCount = await Promise.all((sessions || []).map(async (s) => {
      const { count } = await db.from("messages")
        .select("*", { count: "exact", head: true }).eq("session_id", s.id);
      return { ...s, message_count: count || 0 };
    }));

    res.json({ sessions: sessionsWithCount });
  } catch (err) { next(err); }
});

// Re-explain in different style when confused
router.post("/reexplain", async (req, res, next) => {
  try {
    const { question, subject, examType, style } = req.body;
    if (!question) return res.status(400).json({ error: "question required" });
    const response = await getReExplanation(question, subject, examType, style || "simple");
    res.json({ response });
  } catch (err) { next(err); }
});

// Dynamic SVG Diagram Generator
router.post("/diagram", async (req, res, next) => {
  try {
    const { concept, subject } = req.body;
    if (!concept) return res.status(400).json({ error: "concept required" });
    
    // Check cache first
    const cacheKey = `${concept}_${subject}`.toLowerCase().replace(/\s+/g, "_");
    const cached = diagramCache.get(cacheKey);
    if (cached) return res.json({ svg: cached });
    
    const svg = await generateSVGDiagram(concept, subject);
    if (svg) {
      diagramCache.set(cacheKey, svg);
      res.json({ svg });
    } else {
      res.json({ svg: null });
    }
  } catch (err) { next(err); }
});

// Clear diagram cache (for development)
router.delete("/diagram/cache", (req, res) => {
  diagramCache.clear();
  res.json({ success: true, message: "Cache cleared" });
});

// Think like examiner
router.post("/examiner", async (req, res, next) => {
  try {
    const { question, subject, examType } = req.body;
    if (!question) return res.status(400).json({ error: "question required" });
    const response = await getExaminerThinking(question, subject, examType);
    res.json({ response });
  } catch (err) { next(err); }
});

// Why am I studying this
router.post("/whystudy", async (req, res, next) => {
  try {
    const { topic, subject, examType } = req.body;
    if (!topic) return res.status(400).json({ error: "topic required" });
    const response = await getWhyStudyThis(topic, subject, examType);
    res.json({ response });
  } catch (err) { next(err); }
});

// Multi-teacher style
router.post("/teacherstyle", async (req, res, next) => {
  try {
    const { question, subject, examType, style } = req.body;
    if (!question) return res.status(400).json({ error: "question required" });
    const response = await getMultiTeacherExplanation(question, subject, examType, style || "friendly");
    res.json({ response });
  } catch (err) { next(err); }
});

module.exports = router;
