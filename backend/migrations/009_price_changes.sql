-- Keeps each price change so it stays visible after the alert is read.
CREATE TABLE recurring_price_changes (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  recurring_id INT NOT NULL,
  old_amount DECIMAL(20,2) NOT NULL,
  new_amount DECIMAL(20,2) NOT NULL,
  changed_on DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_price_recurring (recurring_id, changed_on),
  KEY idx_price_user (user_id)
);
