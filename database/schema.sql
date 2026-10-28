-- database/schema.sql
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'authority', 'field_worker')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  location    TEXT NOT NULL,
  ward        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'Other',
  latitude    REAL,
  longitude   REAL,
  image_path  TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  proof_image TEXT,
  proof_note  TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  hype_count  INTEGER NOT NULL DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_assigned_to_status ON reports(assigned_to, status);

CREATE TABLE IF NOT EXISTS hypes (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, report_id)  -- enforce 1 hype per user per report
);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id  INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- NULL = top-level
  body       TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS acknowledgements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id   INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  official_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
