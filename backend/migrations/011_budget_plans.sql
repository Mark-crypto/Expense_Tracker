-- Budget periods, limits that change by month, one record per alert, and alert settings.
ALTER TABLE budget
  ADD COLUMN period ENUM('monthly','weekly','once') NOT NULL DEFAULT 'monthly',
  ADD COLUMN rollover TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN alert_mode ENUM('important','balanced','everything','off') DEFAULT NULL,
  ADD COLUMN warn_at TINYINT DEFAULT NULL;

UPDATE budget SET period = 'once' WHERE has_time_limit = 1 AND budget_id > 0;

ALTER TABLE users
  ADD COLUMN budget_alert_mode ENUM('important','balanced','everything','off') NOT NULL DEFAULT 'balanced',
  ADD COLUMN budget_warn_at TINYINT NOT NULL DEFAULT 80,
  ADD COLUMN budget_emails TINYINT(1) NOT NULL DEFAULT 1;

-- A limit applies from its month on. only_month limits apply to that month alone.
CREATE TABLE budget_limits (
  budget_id INT NOT NULL,
  user_id INT NOT NULL,
  from_month CHAR(7) NOT NULL,
  only_month TINYINT(1) NOT NULL DEFAULT 0,
  amount DECIMAL(20,2) NOT NULL,
  PRIMARY KEY (budget_id, from_month, only_month),
  KEY idx_limits_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE budget_changes (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  budget_id INT NOT NULL,
  old_amount DECIMAL(20,2) NOT NULL,
  new_amount DECIMAL(20,2) NOT NULL,
  scope ENUM('month','forward','move') NOT NULL,
  month CHAR(7) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_changes_budget (budget_id, created_at),
  KEY idx_changes_user (user_id)
) ENGINE=InnoDB;

-- Each alert fires once for its budget and period, whether or not it has been read.
CREATE TABLE budget_alerts (
  budget_id INT NOT NULL,
  user_id INT NOT NULL,
  period_key VARCHAR(10) NOT NULL,
  kind VARCHAR(10) NOT NULL,
  pending_email VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (budget_id, period_key, kind),
  KEY idx_alerts_user (user_id),
  KEY idx_alerts_pending (pending_email)
) ENGINE=InnoDB;

INSERT INTO budget_limits (budget_id, user_id, from_month, only_month, amount)
SELECT budget_id, user_id, DATE_FORMAT(COALESCE(created_at, CURDATE()), '%Y-%m'), 0, amount
FROM budget WHERE user_id IS NOT NULL;

-- Budgets already over have been alerted, so don't send it again.
INSERT INTO budget_alerts (budget_id, user_id, period_key, kind)
SELECT budget_id, user_id, DATE_FORMAT(CURDATE(), '%Y-%m'), 'over'
FROM budget WHERE status = 'exceeded' AND user_id IS NOT NULL;
