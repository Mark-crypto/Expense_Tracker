-- Item names are private per user, so the same name must be allowed for different users.
ALTER TABLE subcategory_suggestions
  DROP INDEX unique_category_subcategory,
  ADD UNIQUE KEY unique_user_category_subcategory (user_id, category, subcategory);
