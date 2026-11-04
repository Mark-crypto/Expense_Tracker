-- First-run setup. New sign-ups start at 'new'; people already using the app
-- are 'existing' and get a one-time card instead of the full setup.
ALTER TABLE users
  ADD COLUMN setup_status ENUM('new','done','existing') NOT NULL DEFAULT 'new',
  ADD COLUMN setup_step TINYINT NOT NULL DEFAULT 0,
  ADD COLUMN setup_hidden TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN pay_set TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN tips_seen VARCHAR(255) NOT NULL DEFAULT '';

UPDATE users SET setup_status = 'existing';
UPDATE users SET pay_set = 1 WHERE pay_type = 'salary';
