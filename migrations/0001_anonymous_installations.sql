CREATE TABLE IF NOT EXISTS anonymous_installations (
  installation_hash TEXT PRIMARY KEY,
  origin TEXT NOT NULL,
  first_seen_day TEXT NOT NULL,
  last_seen_day TEXT NOT NULL,
  app_version TEXT NOT NULL,
  client_kind TEXT NOT NULL DEFAULT 'web',
  CHECK (origin IN ('ustudy.hakhoi.io.vn', 'ustudy.unopia.io.vn')),
  CHECK (client_kind IN ('web'))
);

