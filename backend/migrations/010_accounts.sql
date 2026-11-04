-- Accounts, income, Safe to spend settings and saved expense shortcuts.
-- InnoDB is stated because some servers default to MyISAM, which ignores transactions.
CREATE TABLE accounts (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(60) NOT NULL,
  type ENUM('mpesa','bank','cash','savings','other') NOT NULL DEFAULT 'other',
  spendable TINYINT(1) NOT NULL DEFAULT 1,
  status ENUM('active','archived') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_accounts_user (user_id)
) ENGINE=InnoDB;

-- A known balance on a date. Today's balance is the latest one plus what moved since.
CREATE TABLE account_balances (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  account_id INT NOT NULL,
  balance DECIMAL(20,2) NOT NULL,
  as_of DATE NOT NULL,
  source ENUM('manual','statement') NOT NULL DEFAULT 'manual',
  recorded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_balance_day (account_id, as_of),
  KEY idx_balances_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE account_income (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  account_id INT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  name VARCHAR(150) NOT NULL,
  received_on DATE NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_income_user (user_id, received_on)
) ENGINE=InnoDB;

CREATE TABLE account_transfers (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  from_account_id INT NOT NULL,
  to_account_id INT NOT NULL,
  amount DECIMAL(20,2) NOT NULL,
  moved_on DATE NOT NULL,
  receipt_no VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uniq_transfer_receipt (user_id, receipt_no),
  KEY idx_transfers_user (user_id, moved_on)
) ENGINE=InnoDB;

CREATE TABLE expense_shortcuts (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  merchant VARCHAR(150) NOT NULL,
  category VARCHAR(20) NOT NULL,
  account_id INT DEFAULT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_shortcut (user_id, merchant)
) ENGINE=InnoDB;

ALTER TABLE expense
  ADD COLUMN account_id INT DEFAULT NULL,
  ADD COLUMN created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD KEY idx_expense_account (account_id);

ALTER TABLE recurring_payments ADD COLUMN account_id INT DEFAULT NULL;

ALTER TABLE mpesa_transactions ADD COLUMN transfer_status VARCHAR(10) DEFAULT NULL;

ALTER TABLE users
  ADD COLUMN pay_type ENUM('salary','irregular') NOT NULL DEFAULT 'irregular',
  ADD COLUMN pay_day TINYINT DEFAULT NULL,
  ADD COLUMN safety_buffer DECIMAL(20,2) NOT NULL DEFAULT 2000.00;
