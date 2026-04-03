-- =====================================================
-- ExamGuru AI - Complete Schema v2
-- Run this in Supabase SQL Editor
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  exam_target TEXT NOT NULL DEFAULT 'JEE',
  role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin','teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COURSE CATALOG ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,         -- e.g. 'JEE', 'CLASS_9', 'NEET'
  name TEXT NOT NULL,                -- e.g. 'JEE Main & Advanced'
  category TEXT NOT NULL,            -- 'competitive', 'school'
  grade TEXT,                        -- '9', '10', '11', '12', null for competitive
  stream TEXT,                       -- 'Science', 'Commerce', 'Arts', null for others
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── COURSE ENROLLMENTS (Admin assigns / Student buys) ────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL REFERENCES courses(code),
  enrolled_by UUID REFERENCES users(id),   -- admin who enrolled
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                  -- null = lifetime
  is_active BOOLEAN DEFAULT true,
  payment_status TEXT DEFAULT 'free' CHECK(payment_status IN ('free','pending','paid')),
  UNIQUE(user_id, course_code)
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mock tests
CREATE TABLE IF NOT EXISTS mock_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  questions JSONB NOT NULL,
  answers JSONB,
  score INTEGER,
  total INTEGER,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weak topics
CREATE TABLE IF NOT EXISTS weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  wrong_count INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exam_type, subject, topic)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_tests_user ON mock_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_weak_user ON weak_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_active ON enrollments(user_id, is_active);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON mock_tests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON weak_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON enrollments FOR ALL USING (true) WITH CHECK (true);

-- ─── SEED COURSES ─────────────────────────────────────────────────────────────
INSERT INTO courses (code, name, category, grade, stream, description, price) VALUES
  -- School Courses
  ('FOUNDATION', 'Foundation (Class 6-8)', 'school', '6-8', NULL, 'Basic science and math for middle school', 0),
  ('CLASS_9', 'Class 9 (CBSE/State Board)', 'school', '9', NULL, 'All subjects for Class 9', 0),
  ('CLASS_10', 'Class 10 (CBSE/State Board)', 'school', '10', NULL, 'Board exam preparation for Class 10', 0),
  ('CLASS_11_SCI', 'Class 11 Science', 'school', '11', 'Science', 'Physics, Chemistry, Math, Biology for Class 11', 0),
  ('CLASS_11_COM', 'Class 11 Commerce', 'school', '11', 'Commerce', 'Accounts, Economics, Business Studies for Class 11', 0),
  ('CLASS_11_ARTS', 'Class 11 Arts', 'school', '11', 'Arts', 'History, Geography, Polity, Hindi for Class 11', 0),
  ('CLASS_12_SCI', 'Class 12 Science', 'school', '12', 'Science', 'Physics, Chemistry, Math, Biology for Class 12', 0),
  ('CLASS_12_COM', 'Class 12 Commerce', 'school', '12', 'Commerce', 'Accounts, Economics, Business Studies for Class 12', 0),
  ('CLASS_12_ARTS', 'Class 12 Arts', 'school', '12', 'Arts', 'History, Geography, Polity, Hindi for Class 12', 0),
  ('CLASS_1112_SCI', 'Class 11+12 Science (Combined)', 'school', '11-12', 'Science', 'Complete 2-year Science program', 0),
  -- Competitive
  ('JEE', 'JEE Main & Advanced', 'competitive', NULL, NULL, 'Engineering entrance exam preparation', 0),
  ('NEET', 'NEET UG', 'competitive', NULL, NULL, 'Medical entrance exam preparation', 0),
  ('UPSC', 'UPSC CSE (IAS/IPS/IFS)', 'competitive', NULL, NULL, 'Civil services exam preparation', 0),
  ('UP_PCS', 'UP PCS (UPPSC)', 'competitive', NULL, NULL, 'Uttar Pradesh civil services', 0),
  ('MP_PCS', 'MP PCS (MPPSC)', 'competitive', NULL, NULL, 'Madhya Pradesh civil services', 0),
  ('RAS', 'Rajasthan RAS (RPSC)', 'competitive', NULL, NULL, 'Rajasthan administrative service', 0),
  ('BPSC', 'Bihar BPSC', 'competitive', NULL, NULL, 'Bihar public service commission', 0),
  ('MPSC', 'Maharashtra MPSC', 'competitive', NULL, NULL, 'Maharashtra public service commission', 0),
  ('SSC_CGL', 'SSC CGL', 'competitive', NULL, NULL, 'Combined graduate level exam', 0),
  ('SSC_CHSL', 'SSC CHSL', 'competitive', NULL, NULL, 'Combined higher secondary level', 0)
ON CONFLICT (code) DO NOTHING;

SELECT 'ExamGuru AI v2 schema ready! 🎓' as status;
