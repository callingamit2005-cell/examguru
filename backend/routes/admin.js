const express = require("express");
const { getDB } = require("../db/database");
const router = express.Router();

// ─── Middleware: Admin only ───────────────────────────────────────────────────
const adminOnly = async (req, res, next) => {
  // Accept email from header, body, or query param
  const adminEmail = req.headers.adminemail || 
                     req.headers.adminEmail || 
                     req.body?.adminEmail || 
                     req.query?.adminEmail;
  
  if (!adminEmail) return res.status(401).json({ error: "Admin email required in header" });
  
  const db = getDB();
  const { data: admin } = await db.from("users").select("role").eq("email", adminEmail).single();
  if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  
  req.adminEmail = adminEmail; // attach for use in routes
  next();
};

// ─── Get all courses ──────────────────────────────────────────────────────────
router.get("/courses", async (req, res, next) => {
  try {
    const { data, error } = await getDB().from("courses").select("*").order("category").order("grade");
    if (error) throw new Error(error.message);
    res.json({ courses: data });
  } catch (err) { next(err); }
});

// ─── Get all students ─────────────────────────────────────────────────────────
router.get("/students", adminOnly, async (req, res, next) => {
  try {
    const db = getDB();
    const { data: students, error } = await db.from("users")
      .select("id, name, email, exam_target, role, created_at, last_active")
      .eq("role", "student").order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Get enrollments for each student
    const studentsWithEnrollments = await Promise.all(students.map(async (s) => {
      const { data: enrollments } = await db.from("enrollments")
        .select("course_code, is_active, enrolled_at, expires_at")
        .eq("user_id", s.id).eq("is_active", true);
      return { ...s, enrollments: enrollments || [] };
    }));

    res.json({ students: studentsWithEnrollments });
  } catch (err) { next(err); }
});

// ─── Enroll student in a course ───────────────────────────────────────────────
router.post("/enroll", adminOnly, async (req, res, next) => {
  try {
    const { studentEmail, courseCode, adminEmail } = req.body;
    if (!studentEmail || !courseCode) return res.status(400).json({ error: "studentEmail and courseCode required" });

    const db = getDB();
    const { data: student } = await db.from("users").select("id").eq("email", studentEmail).single();
    if (!student) return res.status(404).json({ error: "Student not found" });

    const { data: admin } = await db.from("users").select("id").eq("email", adminEmail).single();
    const { data: course } = await db.from("courses").select("code, name").eq("code", courseCode).single();
    if (!course) return res.status(404).json({ error: "Course not found" });

    const { data, error } = await db.from("enrollments")
      .upsert({
        user_id: student.id,
        course_code: courseCode,
        enrolled_by: admin?.id,
        is_active: true,
        payment_status: "free"
      }, { onConflict: "user_id,course_code" })
      .select().single();

    if (error) throw new Error(error.message);

    // Update user's exam_target to match their enrolled course
    await db.from("users").update({ exam_target: courseCode }).eq("id", student.id);

    res.json({ success: true, enrollment: data, message: `${studentEmail} enrolled in ${course.name}` });
  } catch (err) { next(err); }
});

// ─── Remove enrollment ────────────────────────────────────────────────────────
router.post("/unenroll", adminOnly, async (req, res, next) => {
  try {
    const { studentEmail, courseCode } = req.body;
    const db = getDB();
    const { data: student } = await db.from("users").select("id").eq("email", studentEmail).single();
    if (!student) return res.status(404).json({ error: "Student not found" });

    await db.from("enrollments")
      .update({ is_active: false }).eq("user_id", student.id).eq("course_code", courseCode);
    res.json({ success: true, message: `Enrollment removed` });
  } catch (err) { next(err); }
});

// ─── Make user admin ──────────────────────────────────────────────────────────
router.post("/make-admin", async (req, res, next) => {
  try {
    const { email, secretKey } = req.body;
    if (secretKey !== (process.env.ADMIN_SECRET || "examguru2026")) {
      return res.status(403).json({ error: "Invalid secret key" });
    }
    const { data, error } = await getDB().from("users")
      .update({ role: "admin" }).eq("email", email).select().single();
    if (error || !data) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, message: `${email} is now admin!` });
  } catch (err) { next(err); }
});

// ─── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/stats", adminOnly, async (req, res, next) => {
  try {
    const db = getDB();
    const [{ count: totalStudents }, { count: totalTests }, { count: totalMessages }, { data: courseStats }] =
      await Promise.all([
        db.from("users").select("*", { count: "exact", head: true }).eq("role", "student"),
        db.from("mock_tests").select("*", { count: "exact", head: true }).not("completed_at", "is", null),
        db.from("messages").select("*", { count: "exact", head: true }).eq("role", "user"),
        db.from("enrollments").select("course_code").eq("is_active", true)
      ]);

    const courseCounts = (courseStats || []).reduce((acc, e) => {
      acc[e.course_code] = (acc[e.course_code] || 0) + 1;
      return acc;
    }, {});

    res.json({ totalStudents, totalTests, totalMessages, courseCounts });
  } catch (err) { next(err); }
});

module.exports = router;
