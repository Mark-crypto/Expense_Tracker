-- Required by the forgot and reset password flow.
ALTER TABLE users
  ADD COLUMN reset_password_token VARCHAR(64) NULL,
  ADD COLUMN reset_password_expires DATETIME NULL;
