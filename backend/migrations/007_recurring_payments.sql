-- Bills and subscriptions a user tracks, captured as expenses on their due date.
CREATE TABLE recurring_payments (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(20) NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  varies TINYINT(1) NOT NULL DEFAULT 0,
  frequency ENUM('weekly','monthly','termly','yearly') NOT NULL DEFAULT 'monthly',
  next_due DATE NOT NULL,
  due_day TINYINT NOT NULL,
  status ENUM('active','stopped') NOT NULL DEFAULT 'active',
  stop_reason VARCHAR(30) DEFAULT NULL,
  stop_note VARCHAR(255) DEFAULT NULL,
  stopped_at DATE DEFAULT NULL,
  last_paid DATE DEFAULT NULL,
  reminded_for DATE DEFAULT NULL,
  missed_for DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_recurring_name (user_id, name),
  KEY idx_recurring_due (status, next_due)
);

ALTER TABLE expense
  ADD COLUMN recurring_id INT DEFAULT NULL,
  ADD KEY idx_expense_recurring (recurring_id);

ALTER TABLE users ADD COLUMN bill_reminders TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE notifications
  MODIFY COLUMN type ENUM('budget_exceeded','system','info','bill') DEFAULT 'system';
