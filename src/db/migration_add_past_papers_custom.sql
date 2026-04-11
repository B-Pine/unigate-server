-- Past Paper External Links (admin-managed sources)
CREATE TABLE IF NOT EXISTS past_paper_links (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  description TEXT,
  created_by  INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Past Paper Custom Subjects (admin can add beyond defaults)
CREATE TABLE IF NOT EXISTS past_paper_subjects (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL CHECK (level IN ('Primary', 'O-Level', 'A-Level')),
  UNIQUE (name, level)
);
