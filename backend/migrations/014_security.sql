-- PIN, login lockout per email, and when the password last changed.
-- Times are milliseconds since 1970 (UTC), so the server's time zone can't shift them.
ALTER TABLE users
  ADD COLUMN pin_hash VARCHAR(100) DEFAULT NULL,
  ADD COLUMN pin_set_at BIGINT DEFAULT NULL,
  ADD COLUMN pin_failures TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN pin_locked_until BIGINT DEFAULT NULL,
  ADD COLUMN login_failures TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN login_locked_until BIGINT DEFAULT NULL,
  ADD COLUMN password_changed_at BIGINT DEFAULT NULL;
