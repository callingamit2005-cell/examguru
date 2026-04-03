-- =====================================================
-- Payment Migration — Run in Supabase SQL Editor
-- =====================================================

-- Add premium fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium     BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_plan   TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_start  TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_used     BOOLEAN DEFAULT false;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id    TEXT UNIQUE NOT NULL,
  payment_id  TEXT,
  plan        TEXT NOT NULL CHECK(plan IN ('monthly','yearly','trial')),
  amount      INTEGER NOT NULL,
  currency    TEXT DEFAULT 'INR',
  status      TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  paid_at     TIMESTAMPTZ
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_payments_user_id  ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_users_premium     ON users(is_premium);
