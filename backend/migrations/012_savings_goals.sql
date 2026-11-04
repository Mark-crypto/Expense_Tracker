-- Savings goals. A goal tied to an account takes its progress from that balance;
-- any other goal counts the money set aside in goal_moves.
CREATE TABLE savings_goals (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(60) NOT NULL,
  target DECIMAL(20,2) NOT NULL,
  due_date DATE DEFAULT NULL,
  account_id INT DEFAULT NULL,
  -- Where the plan starts, so a new target or date doesn't count as falling behind.
  start_amount DECIMAL(20,2) NOT NULL DEFAULT 0,
  started_on DATE NOT NULL,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  behind_noted_on DATE DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_user (user_id, status)
) ENGINE=InnoDB;

-- Positive when money is set aside, negative when it's taken out.
CREATE TABLE goal_moves (
  id INT NOT NULL AUTO_INCREMENT,
  goal_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  moved_on DATE NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_goal_moves_goal (goal_id),
  KEY idx_goal_moves_user (user_id)
) ENGINE=InnoDB;

ALTER TABLE notifications
  MODIFY type ENUM('budget_exceeded','system','info','bill','goal') DEFAULT 'system';
