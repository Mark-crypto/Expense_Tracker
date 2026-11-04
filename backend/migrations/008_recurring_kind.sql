-- Bills are needs; subscriptions are choices people may want to cut.
ALTER TABLE recurring_payments
  ADD COLUMN kind ENUM('bill','subscription') NOT NULL DEFAULT 'bill' AFTER name;

UPDATE recurring_payments SET kind = 'subscription' WHERE category IN ('entertainment', 'technology');
