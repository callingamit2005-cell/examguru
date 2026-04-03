const express = require("express");
const { getDB } = require("../db/database");

const router = express.Router();

// ─── Course config: subjects per course ───────────────────────────────────────
const COURSE_SUBJECTS = {
  // School
  FOUNDATION:    ["Mathematics", "Science", "Social Science", "Hindi", "English"],
  CLASS_9:       ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  CLASS_10:      ["Mathematics", "Science", "Social Science", "Hindi", "English", "Sanskrit"],
  CLASS_11_SCI:  ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  CLASS_11_COM:  ["Accountancy", "Economics", "Business Studies", "Mathematics", "English"],
  CLASS_11_ARTS: ["History", "Geography", "Political Science", "Hindi", "English", "Sociology"],
  CLASS_12_SCI:  ["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  CLASS_12_COM:  ["Accountancy", "Economics", "Business Studies", "Mathematics", "English"],
  CLASS_12_ARTS: ["History", "Geography", "Political Science", "Hindi", "English", "Sociology"],
  CLASS_1112_SCI:["Physics", "Chemistry", "Mathematics", "Biology", "English"],
  // Competitive
  JEE:      ["Physics", "Chemistry", "Mathematics"],
  NEET:     ["Physics", "Chemistry", "Biology"],
  UPSC:     ["History", "Geography", "Polity", "Economy", "Science & Technology", "Environment", "Current Affairs", "Ethics"],
  UP_PCS:   ["History", "Geography", "Polity", "Economy", "UP Special", "Current Affairs", "Hindi"],
  MP_PCS:   ["History", "Geography", "Polity", "Economy", "MP Special", "Current Affairs", "Hindi"],
  RAS:      ["History", "Geography", "Polity", "Economy", "Rajasthan Special", "Current Affairs", "Hindi"],
  BPSC:     ["History", "Geography", "Polity", "Economy", "Bihar Special", "Current Affairs", "Hindi"],
  MPSC:     ["History", "Geography", "Polity", "Economy", "Maharashtra Special", "Current Affairs", "Marathi"],
  SSC_CGL:  ["General Intelligence", "General Awareness", "Quantitative Aptitude", "English Language"],
  SSC_CHSL: ["General Intelligence", "General Awareness", "Quantitative Aptitude", "English Language"],
};

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, examTarget } = req.body;
    if (!name || !email) return res.status(400).json({ error: "name and email required" });

    const db = getDB();

    // Check if user exists
    let { data: existing } = await db.from("users").select("*").eq("email", email).single();

    if (!existing) {
      // New user — create with default course or provided
      const defaultCourse = examTarget || "CLASS_9";
      const { data, error } = await db.from("users")
        .insert({ name, email, exam_target: defaultCourse })
        .select().single();
      if (error) throw new Error(error.message);
      existing = data;

      // Auto-enroll in selected course (free)
      try {
        await db.from("enrollments").insert({
          user_id: existing.id,
          course_code: defaultCourse,
          payment_status: "free",
          is_active: true
        });
      } catch (e) { /* ignore duplicate enrollment */ }
    }

    // Get active enrollments
    const { data: enrollments } = await db.from("enrollments")
      .select("course_code, is_active")
      .eq("user_id", existing.id)
      .eq("is_active", true);

    const enrolledCourses = (enrollments || []).map(e => e.course_code);

    // Get course details
    const { data: courseDetails } = await db.from("courses")
      .select("code, name, category, grade, stream")
      .in("code", enrolledCourses.length > 0 ? enrolledCourses : [existing.exam_target]);

    res.json({
      user: {
        id: existing.id,
        name: existing.name,
        email: existing.email,
        examTarget: existing.exam_target,
        role: existing.role || "student",  // always return DB role
        enrolledCourses,
        courseDetails: courseDetails || [],
        subjects: COURSE_SUBJECTS[existing.exam_target] || COURSE_SUBJECTS.CLASS_9
      }
    });
  } catch (err) { next(err); }
});

router.get("/profile/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const db = getDB();
    const { data: user, error } = await db.from("users").select("*").eq("id", userId).single();
    if (error || !user) return res.status(404).json({ error: "User not found" });

    const { data: enrollments } = await db.from("enrollments")
      .select("course_code, enrolled_at, expires_at, payment_status")
      .eq("user_id", userId).eq("is_active", true);

    const enrolledCourses = (enrollments || []).map(e => e.course_code);

    const { data: courseDetails } = await db.from("courses")
      .select("code, name, category, grade, stream")
      .in("code", enrolledCourses.length > 0 ? enrolledCourses : [user.exam_target]);

    const testStats = await db.from("mock_tests")
      .select("score, total").eq("user_id", userId).not("completed_at", "is", null);
    const tests = testStats.data || [];
    const totalTests = tests.length;
    const avgScore = totalTests > 0
      ? Math.round(tests.reduce((a, t) => a + (t.score / t.total * 100), 0) / totalTests)
      : 0;

    const { count: chatCount } = await db.from("messages")
      .select("*", { count: "exact", head: true }).eq("user_id", userId).eq("role", "user");

    const { data: weakTopics } = await db.from("weak_topics")
      .select("subject, topic, wrong_count").eq("user_id", userId)
      .order("wrong_count", { ascending: false }).limit(10);

    res.json({
      user: { id: user.id, name: user.name, email: user.email, examTarget: user.exam_target, role: user.role, created_at: user.created_at },
      enrollments: enrollments || [],
      enrolledCourses,
      courseDetails: courseDetails || [],
      subjects: COURSE_SUBJECTS[user.exam_target] || [],
      stats: { total_tests: totalTests, avg_score: avgScore, total_questions_asked: chatCount || 0 },
      weakTopics: weakTopics || []
    });
  } catch (err) { next(err); }
});

// Get subjects for a course
router.get("/subjects/:courseCode", (req, res) => {
  const subjects = COURSE_SUBJECTS[req.params.courseCode];
  if (!subjects) return res.status(404).json({ error: "Course not found" });
  res.json({ subjects });
});

module.exports = router;
