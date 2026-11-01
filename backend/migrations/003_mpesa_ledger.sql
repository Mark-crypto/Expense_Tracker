-- Keeps expense details, blocks duplicate imports, and stores every statement row for Money X-ray.
ALTER TABLE expense
  ADD COLUMN description VARCHAR(255) NULL,
  ADD COLUMN merchant VARCHAR(150) NULL,
  ADD COLUMN receipt_no VARCHAR(20) NULL,
  ADD UNIQUE KEY uniq_expense_receipt (user_id, receipt_no);

-- A fee row shares its receipt number with the payment it belongs to, so kind is part of the key.
CREATE TABLE mpesa_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  receipt_no VARCHAR(20) NOT NULL,
  occurred_at DATETIME NOT NULL,
  details VARCHAR(255) NOT NULL,
  kind VARCHAR(20) NOT NULL,
  counterparty VARCHAR(150) NULL,
  paid_in DECIMAL(20,2) NOT NULL DEFAULT 0,
  withdrawn DECIMAL(20,2) NOT NULL DEFAULT 0,
  balance DECIMAL(20,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_mpesa_row (user_id, receipt_no, kind),
  KEY idx_mpesa_user_time (user_id, occurred_at)
);

CREATE TABLE merchant_categories (
  user_id INT NOT NULL,
  merchant VARCHAR(150) NOT NULL,
  category VARCHAR(20) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, merchant)
);
