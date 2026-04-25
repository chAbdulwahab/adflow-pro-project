-- =====================================================
-- Migration: ad_views table
-- Run this in your Supabase SQL editor
-- =====================================================

CREATE TABLE IF NOT EXISTS ad_views (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id       uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  viewer_id   uuid REFERENCES users(id) ON DELETE SET NULL, -- NULL = anonymous
  ip_hash     text,       -- hashed IP for dedup without storing raw IP
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-ad aggregation
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_id    ON ad_views(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_views_viewed_at ON ad_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_ad_views_ad_date   ON ad_views(ad_id, viewed_at);

-- Enable RLS (admin client bypasses this anyway)
ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
