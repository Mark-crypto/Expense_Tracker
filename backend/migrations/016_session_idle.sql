-- When each sign-in was last used (milliseconds since 1970, UTC), so idle ones can be refused.
ALTER TABLE refresh_tokens ADD COLUMN last_used_at BIGINT DEFAULT NULL;

-- Sign-ins made under the old 7-day rule end within 12 hours of this change.
UPDATE refresh_tokens SET expires_at = LEAST(expires_at, NOW() + INTERVAL 12 HOUR);
