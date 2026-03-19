-- Migration: Add youtube_url column to scholarships and jobs tables
-- Run this against your existing database to add the new column

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(500);
