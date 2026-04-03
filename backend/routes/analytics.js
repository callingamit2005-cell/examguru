const express = require("express");
const { getDB } = require("../db/database");

const router = express.Router();

router.get("/dashboard/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const db = getDB();

    const [{ data: recentTests }, { data: weakTopics }, { data: allTests }] = await Promise.all([
      db.from("mock_tests").select("exam_type, subject, score, total, completed_at")
        .eq("user_id", userId).not("completed_at", "is", null)
        .order("completed_at", { ascending: false }).limit(7),
      db.from("weak_topics").select("subject, topic, wrong_count")
        .eq("user_id", userId).order("wrong_count", { ascending: false }).limit(5),
      db.from("mock_tests").select("subject, score, total")
        .eq("user_id", userId).not("completed_at", "is", null)
    ]);

    // Add percentage to recent tests
    const testsWithPct = (recentTests || []).map(t => ({
      ...t, pct: t.total > 0 ? Math.round((t.score / t.total) * 100) : 0
    }));

    // Subject performance
    const subjectMap = {};
    (allTests || []).forEach(t => {
      if (!subjectMap[t.subject]) subjectMap[t.subject] = { scores: [], subject: t.subject };
      subjectMap[t.subject].scores.push((t.score / t.total) * 100);
    });
    const subjectPerformance = Object.values(subjectMap).map(s => ({
      subject: s.subject,
      avg_pct: Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length),
      attempts: s.scores.length
    }));

    res.json({
      recentTests: testsWithPct,
      subjectPerformance,
      weakTopics: weakTopics || [],
      streakData: []
    });
  } catch (err) { next(err); }
});

module.exports = router;
