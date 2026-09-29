ALTER TABLE anonymous_installations
ADD COLUMN deleted_day TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS installation_activity_days (
  installation_hash TEXT NOT NULL,
  active_day TEXT NOT NULL,
  PRIMARY KEY (installation_hash, active_day),
  FOREIGN KEY (installation_hash)
    REFERENCES anonymous_installations(installation_hash)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_installation_activity_day
ON installation_activity_days(active_day);

CREATE INDEX IF NOT EXISTS idx_anonymous_installations_first_seen
ON anonymous_installations(first_seen_day);

CREATE INDEX IF NOT EXISTS idx_anonymous_installations_deleted_day
ON anonymous_installations(deleted_day);

-- The complete history before this migration cannot be reconstructed. These
-- are the two activity dates that the existing summary row can prove.
INSERT OR IGNORE INTO installation_activity_days (installation_hash, active_day)
SELECT installation_hash, first_seen_day
FROM anonymous_installations;

INSERT OR IGNORE INTO installation_activity_days (installation_hash, active_day)
SELECT installation_hash, last_seen_day
FROM anonymous_installations;
