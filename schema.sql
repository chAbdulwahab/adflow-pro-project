-- Database Schema for AdFlow Pro
-- Add your SQL tables and schemas here
-- ============================================================
-- ADFLOW PRO — COMPLETE DATABASE SCHEMA
-- 13 Tables + Indexes + Seed Data
-- ============================================================

-- Enable UUID extension (needed for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'client'
                  CHECK (role IN ('client', 'moderator', 'admin', 'super_admin')),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'banned')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: seller_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name  VARCHAR(100),
  business_name VARCHAR(150),
  phone         VARCHAR(20),
  city          VARCHAR(100),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: packages
-- ============================================================
CREATE TABLE IF NOT EXISTS packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) NOT NULL,
  duration_days INT NOT NULL,
  weight        INT NOT NULL DEFAULT 1,
  is_featured   BOOLEAN DEFAULT FALSE,
  price         DECIMAL(10,2) NOT NULL,
  description   TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: cities
-- ============================================================
CREATE TABLE IF NOT EXISTS cities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) UNIQUE NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: ads (CORE TABLE)
-- ============================================================
CREATE TABLE IF NOT EXISTS ads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id       UUID REFERENCES packages(id),
  category_id      UUID REFERENCES categories(id),
  city_id          UUID REFERENCES cities(id),
  title            VARCHAR(200) NOT NULL,
  slug             VARCHAR(250) UNIQUE NOT NULL,
  description      TEXT NOT NULL,
  price            DECIMAL(12,2),
  status           VARCHAR(30) NOT NULL DEFAULT 'draft'
                     CHECK (status IN (
                       'draft', 'submitted', 'under_review',
                       'payment_pending', 'payment_submitted',
                       'payment_verified', 'scheduled', 'published',
                       'expired', 'rejected', 'archived'
                     )),
  publish_at       TIMESTAMPTZ,
  expire_at        TIMESTAMPTZ,
  rank_score       DECIMAL(10,2) DEFAULT 0,
  admin_boost      INT DEFAULT 0,
  is_featured      BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 7: ad_media
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_media (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id                    UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  source_type              VARCHAR(20) NOT NULL
                             CHECK (source_type IN ('image', 'youtube', 'cloudinary')),
  original_url             TEXT NOT NULL,
  normalized_thumbnail_url TEXT,
  validation_status        VARCHAR(20) DEFAULT 'pending'
                             CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  display_order            INT DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  amount          DECIMAL(10,2) NOT NULL,
  method          VARCHAR(50) NOT NULL,
  transaction_ref VARCHAR(100) UNIQUE NOT NULL,
  sender_name     VARCHAR(100) NOT NULL,
  screenshot_url  TEXT,
  status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'rejected')),
  verified_by     UUID REFERENCES users(id),
  verified_at     TIMESTAMPTZ,
  rejection_note  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  message    TEXT NOT NULL,
  type       VARCHAR(50) NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  link       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: audit_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id   UUID NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: ad_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id           UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  previous_status VARCHAR(30),
  new_status      VARCHAR(30) NOT NULL,
  changed_by      UUID REFERENCES users(id),
  note            TEXT,
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: learning_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question   TEXT NOT NULL,
  answer     TEXT NOT NULL,
  topic      VARCHAR(100),
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: system_health_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS system_health_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source      VARCHAR(100) NOT NULL,
  response_ms INT,
  checked_at  TIMESTAMPTZ DEFAULT NOW(),
  status      VARCHAR(20) CHECK (status IN ('ok', 'warning', 'error')),
  details     JSONB
);

-- ============================================================
-- INDEXES (for performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_ads_status ON ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_publish_at ON ads(publish_at);
CREATE INDEX IF NOT EXISTS idx_ads_expire_at ON ads(expire_at);
CREATE INDEX IF NOT EXISTS idx_ads_rank_score ON ads(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_ref ON payments(transaction_ref);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ad_media_ad_id ON ad_media(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_status_history_ad_id ON ad_status_history(ad_id);

-- ============================================================
-- SEED DATA — PACKAGES
-- ============================================================
INSERT INTO packages (name, duration_days, weight, is_featured, price, description) VALUES
  ('Basic',    7,  1, FALSE, 500.00,  'Basic 7-day listing. No homepage placement.'),
  ('Standard', 15, 2, FALSE, 1200.00, 'Standard 15-day listing with category priority.'),
  ('Premium',  30, 3, TRUE,  2500.00, 'Premium 30-day listing with homepage featured placement.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEED DATA — CATEGORIES
-- ============================================================
INSERT INTO categories (name, slug) VALUES
  ('Real Estate', 'real-estate'),
  ('Vehicles',    'vehicles'),
  ('Electronics', 'electronics'),
  ('Jobs',        'jobs'),
  ('Services',    'services')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA — CITIES
-- ============================================================
INSERT INTO cities (name, slug) VALUES
  ('Karachi',    'karachi'),
  ('Lahore',     'lahore'),
  ('Islamabad',  'islamabad'),
  ('Rawalpindi', 'rawalpindi'),
  ('Faisalabad', 'faisalabad')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA — LEARNING QUESTIONS
-- ============================================================
INSERT INTO learning_questions (question, answer, topic, difficulty) VALUES
  ('What is the first step before publishing an ad?', 'Ad must be approved by moderator and payment verified.', 'workflow', 'easy'),
  ('What does rank_score include?', 'Featured status, package weight, freshness, admin boost, and seller verification.', 'ranking', 'medium'),
  ('Can expired ads appear on the homepage?', 'No. Public queries filter by status=published AND expire_at > NOW().', 'visibility', 'easy'),
  ('What happens when a payment is rejected?', 'Ad goes back to payment_pending and client is notified.', 'workflow', 'medium'),
  ('Why use external media URLs only?', 'To avoid storage costs and simplify deployment. Users provide YouTube, Cloudinary, or direct image URLs.', 'media', 'easy')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE! All 13 tables created.
-- ============================================================
SELECT 'Schema created successfully!' AS status,
       (SELECT COUNT(*) FROM packages)   AS packages_count,
       (SELECT COUNT(*) FROM categories) AS categories_count,
       (SELECT COUNT(*) FROM cities)     AS cities_count;