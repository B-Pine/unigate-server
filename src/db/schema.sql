DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS advice_sessions CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS past_papers CASCADE;
DROP TABLE IF EXISTS combination_faculty CASCADE;
DROP TABLE IF EXISTS faculties CASCADE;
DROP TABLE IF EXISTS combinations CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS scholarships CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scholarships
CREATE TABLE scholarships (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  university    VARCHAR(255) NOT NULL,
  country       VARCHAR(100) NOT NULL,
  description   TEXT,
  requirements  TEXT,
  deadline      DATE,
  form_link     VARCHAR(500),
  status        VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  image_url     VARCHAR(500),
  audio_url     VARCHAR(500),
  platform_link VARCHAR(500),
  created_by    INTEGER REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jobs
CREATE TABLE jobs (
  id               SERIAL PRIMARY KEY,
  company          VARCHAR(255) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  description      TEXT,
  qualifications   TEXT,
  experience_level VARCHAR(50),
  deadline         DATE,
  form_link        VARCHAR(500),
  status           VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  image_url        VARCHAR(500),
  audio_url        VARCHAR(500),
  platform_link    VARCHAR(500),
  created_by       INTEGER REFERENCES users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Combinations
CREATE TABLE combinations (
  id   SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL
);

-- Faculties
CREATE TABLE faculties (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  description TEXT
);

-- Combination-Faculty mapping
CREATE TABLE combination_faculty (
  combination_id INTEGER NOT NULL REFERENCES combinations(id) ON DELETE CASCADE,
  faculty_id     INTEGER NOT NULL REFERENCES faculties(id) ON DELETE CASCADE,
  PRIMARY KEY (combination_id, faculty_id)
);

-- Past Papers
CREATE TABLE past_papers (
  id                       SERIAL PRIMARY KEY,
  subject                  VARCHAR(100) NOT NULL,
  year                     VARCHAR(10) NOT NULL,
  level                    VARCHAR(50) CHECK (level IN ('Primary', 'O-Level', 'A-Level')),
  category                 VARCHAR(10) NOT NULL DEFAULT 'free' CHECK (category IN ('free', 'paid')),
  file_path                VARCHAR(500) NOT NULL,
  original_filename        VARCHAR(255) NOT NULL,
  answer_file_path         VARCHAR(500),
  answer_original_filename VARCHAR(255),
  uploaded_by              INTEGER REFERENCES users(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Time Slots
CREATE TABLE time_slots (
  id          SERIAL PRIMARY KEY,
  day_of_week VARCHAR(20) NOT NULL,
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- Advice Sessions
CREATE TABLE advice_sessions (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id),
  time_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
  reason       TEXT NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Completed', 'Rejected')),
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bookmarks
CREATE TABLE bookmarks (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  item_type  VARCHAR(20) NOT NULL CHECK (item_type IN ('scholarship', 'job')),
  item_id    INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

-- Payments (for paid past papers access)
CREATE TABLE payments (
  id                   SERIAL PRIMARY KEY,
  user_id              INTEGER NOT NULL REFERENCES users(id),
  screenshot_path      VARCHAR(500) NOT NULL,
  screenshot_filename  VARCHAR(255) NOT NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes          TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
