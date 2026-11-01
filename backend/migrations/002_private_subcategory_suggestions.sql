-- NULL user_id means a shared starter suggestion; anything else is private to that user.
ALTER TABLE subcategory_suggestions
  ADD COLUMN user_id INT NULL,
  ADD INDEX idx_subcategory_suggestions_user (user_id);
