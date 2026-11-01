-- Detected bills a user has said are not really recurring.
CREATE TABLE dismissed_bills (
  user_id INT NOT NULL,
  bill_key VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, bill_key)
);
