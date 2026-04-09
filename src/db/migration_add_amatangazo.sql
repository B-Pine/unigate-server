CREATE TABLE IF NOT EXISTS amatangazo (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  organization  VARCHAR(255) NOT NULL,
  category      VARCHAR(100) NOT NULL,
  description   TEXT,
  requirements  TEXT,
  deadline      DATE,
  form_link     VARCHAR(500),
  status        VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  image_url     VARCHAR(500),
  audio_url     VARCHAR(500),
  platform_link VARCHAR(500),
  youtube_url   VARCHAR(500),
  created_by    INTEGER REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_item_type_check;
ALTER TABLE bookmarks ADD CONSTRAINT bookmarks_item_type_check CHECK (item_type IN ('scholarship', 'job', 'amatangazo'));
