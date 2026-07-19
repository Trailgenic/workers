PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS trackers (
  id TEXT PRIMARY KEY,
  manage_token_hash TEXT NOT NULL UNIQUE,
  phone_e164 TEXT NOT NULL,
  permit_id TEXT NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'cancelled')),
  consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS trackers_active_permit
  ON trackers (status, permit_id, party_size);

CREATE TABLE IF NOT EXISTS tracker_dates (
  tracker_id TEXT NOT NULL REFERENCES trackers(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  PRIMARY KEY (tracker_id, date)
);

CREATE INDEX IF NOT EXISTS tracker_dates_lookup
  ON tracker_dates (date, tracker_id);

CREATE TABLE IF NOT EXISTS availability_snapshots (
  permit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  remaining INTEGER NOT NULL CHECK (remaining >= 0),
  observed_at TEXT NOT NULL,
  PRIMARY KEY (permit_id, date)
);

CREATE TABLE IF NOT EXISTS availability_events (
  id TEXT PRIMARY KEY,
  permit_id TEXT NOT NULL,
  date TEXT NOT NULL,
  previous_remaining INTEGER,
  current_remaining INTEGER NOT NULL CHECK (current_remaining >= 0),
  detected_at TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('inventory_increase', 'current_match'))
);

CREATE INDEX IF NOT EXISTS availability_events_lookup
  ON availability_events (permit_id, date, detected_at);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES availability_events(id),
  tracker_id TEXT NOT NULL REFERENCES trackers(id),
  status TEXT NOT NULL CHECK (status IN ('queued', 'sending', 'retry', 'sent', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  sent_at TEXT,
  UNIQUE (event_id, tracker_id)
);

CREATE INDEX IF NOT EXISTS notifications_status
  ON notifications (status, created_at);

CREATE TABLE IF NOT EXISTS poll_runs (
  id TEXT PRIMARY KEY,
  permit_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  http_status INTEGER,
  inventory_count INTEGER NOT NULL DEFAULT 0,
  notifications_queued INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS poll_runs_health
  ON poll_runs (status, completed_at);

CREATE INDEX IF NOT EXISTS poll_runs_permit
  ON poll_runs (permit_id, started_at);
