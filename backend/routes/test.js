const express = require("express");
const { getDB } = require("../db/database");
const { generateMockTest, identifyWeakTopics } = require("../controllers/aiController");

const router = express.Router();

router.post("/generate", async (req, res, next) => {
  try {
    const { userId, examType, subject, numQuestions = 10, difficulty = "mixed" } = req.body;
    if (!userId || !examType || !subject)
      return res.status(400).json({ error: "userId, examType, subject are required" });

    const questionsData = await generateMockTest(examType, subject, numQuestions, difficulty);
    const db = getDB();

    const { data: test, error } = await db.from("mock_tests")
      .insert({ user_id: userId, exam_type: examType, subject, questions: questionsData.questions, total: questionsData.questions.length })
      .select().single();

    if (error) throw new Error(error.message);

    const safeQuestions = questionsData.questions.map(q => ({
      id: q.id, question: q.question, options: q.options, topic: q.topic, difficulty: q.difficulty
    }));

    res.json({ testId: test.id, questions: safeQuestions, total: safeQuestions.length });
  } catch (err) { next(err); }
});

router.post("/submit", async (req, res, next) => {
  try {
    const { testId, userId, userAnswers } = req.body;
    if (!testId || !userId || !userAnswers)
      return res.status(400).json({ error: "testId, userId, userAnswers required" });

    const db = getDB();
    const { data: test, error } = await db.from("mock_tests")
      .select("*").eq("id", testId).eq("user_id", userId).single();

    if (error || !test) return res.status(404).json({ error: "Test not found" });
    if (test.completed_at) return res.status(400).json({ error: "Test already submitted" });

    const questions = test.questions;
    let score = 0;
    const results = [];
    const wrongAnswers = [];

    questions.forEach(q => {
      const userAnswer = userAnswers[q.id];
      const isCorrect = userAnswer === q.correct;
      if (isCorrect) score++;
      else wrongAnswers.push({ question: q.question, topic: q.topic, userAnswer, correct: q.correct });
      results.push({ id: q.id, question: q.question, options: q.options, userAnswer, correct: q.correct, isCorrect, explanation: q.explanation, topic: q.topic });
    });

    await db.from("mock_tests").update({
      answers: userAnswers, score, completed_at: new Date().toISOString()
    }).eq("id", testId);

    // Save weak topics
    if (wrongAnswers.length > 0) {
      const weakTopicNames = await identifyWeakTopics(wrongAnswers);
      for (const topic of weakTopicNames) {
        const { data: existing } = await db.from("weak_topics")
          .select("id, wrong_count").eq("user_id", userId)
          .eq("exam_type", test.exam_type).eq("subject", test.subject).eq("topic", topic).single();

        if (existing) {
          await db.from("weak_topics").update({ wrong_count: existing.wrong_count + 1, updated_at: new Date().toISOString() }).eq("id", existing.id);
        } else {
          await db.from("weak_topics").insert({ user_id: userId, exam_type: test.exam_type, subject: test.subject, topic });
        }
      }
    }

    const percentage = Math.round((score / questions.length) * 100);
    const grade = percentage >= 90 ? "A+" : percentage >= 75 ? "A" : percentage >= 60 ? "B" : percentage >= 45 ? "C" : "D";

    res.json({ score, total: questions.length, percentage, grade, results, weakAreas: wrongAnswers.map(w => w.topic) });
  } catch (err) { next(err); }
});

router.get("/history/:userId", async (req, res, next) => {
  try {
    const { data: tests, error } = await getDB().from("mock_tests")
      .select("id, exam_type, subject, score, total, completed_at, created_at")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false }).limit(20);
    if (error) throw new Error(error.message);
    res.json({ tests: tests || [] });
  } catch (err) { next(err); }
});

module.exports = router;
