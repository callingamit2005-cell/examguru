-- =====================================================
-- Content Upload System Migration
-- Run in Supabase SQL Editor
-- =====================================================

-- Study content table — stores uploaded papers, notes, chapters
CREATE TABLE IF NOT EXISTS study_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  subject      TEXT NOT NULL,          -- Auto-detected: Physics, History, etc.
  exam_type    TEXT NOT NULL,          -- JEE, NEET, UPSC, CLASS_9, etc.
  content_type TEXT DEFAULT 'notes',   -- notes | paper | chapter | formula
  content_text TEXT NOT NULL,          -- Full text content
  source       TEXT,                   -- "NCERT Ch5", "2023 Board Paper" etc.
  exam_year    INTEGER,                -- 2023, 2024 etc. (for past papers)
  importance   INTEGER DEFAULT 5,      -- 1-10 (AI sets this)
  uploaded_by  UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT true
);

-- Index for fast subject+exam search
CREATE INDEX IF NOT EXISTS idx_content_subject   ON study_content(subject, exam_type);
CREATE INDEX IF NOT EXISTS idx_content_exam_type ON study_content(exam_type);
CREATE INDEX IF NOT EXISTS idx_content_active    ON study_content(is_active);

-- Exam topic frequency — tracks how often topics appear in exams
CREATE TABLE IF NOT EXISTS topic_frequency (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  exam_type  TEXT NOT NULL,
  frequency  INTEGER DEFAULT 1,      -- times appeared in exams
  last_year  INTEGER,                -- last year it appeared
  probability NUMERIC DEFAULT 0.5,   -- 0-1 exam probability
  UNIQUE(topic, subject, exam_type)
);

CREATE INDEX IF NOT EXISTS idx_topic_freq ON topic_frequency(exam_type, subject);
