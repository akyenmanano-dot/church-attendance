-- Church Attendance Management System — schema.sql

CREATE TABLE IF NOT EXISTS departments (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS members (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  phone         VARCHAR(30),
  email         VARCHAR(150),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  join_date     DATE DEFAULT CURRENT_DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'active' -- active | inactive
);

CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  service_date  DATE NOT NULL,
  service_type  VARCHAR(50) NOT NULL DEFAULT 'sunday', -- sunday | midweek | special
  name          VARCHAR(150),
  UNIQUE (service_date, service_type)
);

CREATE TABLE IF NOT EXISTS attendance (
  id            SERIAL PRIMARY KEY,
  member_id     INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  service_id    INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  marked_by     VARCHAR(100),          -- usher/user who marked it
  marked_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, service_id)       -- prevents double-marking (handles concurrent ushers)
);

CREATE TABLE IF NOT EXISTS flags (
  id            SERIAL PRIMARY KEY,
  member_id     INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reason        VARCHAR(200) NOT NULL,
  streak_count  INTEGER,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved      BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'usher' -- admin | dept_head | usher
);

CREATE TABLE IF NOT EXISTS first_timers (
  id            SERIAL PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100),
  phone         VARCHAR(30),
  invited_by    VARCHAR(150),          -- who invited them, if known
  notes         TEXT,
  service_id    INTEGER REFERENCES services(id) ON DELETE SET NULL,
  logged_by     VARCHAR(100),          -- usher/admin who logged them
  followed_up   BOOLEAN NOT NULL DEFAULT FALSE,
  followed_up_at TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_attendance_service ON attendance(service_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_flags_member_unresolved ON flags(member_id) WHERE resolved = FALSE;
