-- Other names a bill is paid under, learned when someone links a payment to it
-- ("KPLC PREPAID" is my "Electricity"). Stored lower-case.
CREATE TABLE bill_aliases (
  recurring_id INT NOT NULL,
  user_id INT NOT NULL,
  alias VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recurring_id, alias),
  KEY idx_bill_aliases_user (user_id)
) ENGINE=InnoDB;
