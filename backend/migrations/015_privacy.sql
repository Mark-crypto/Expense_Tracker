-- When someone accepted the privacy policy (milliseconds since 1970, UTC).
ALTER TABLE users ADD COLUMN policy_accepted_at BIGINT DEFAULT NULL;

-- Phone numbers already imported keep only their last 3 digits, the same way new imports do.
-- Matches 0712345678, 254712345678 and part-hidden 254712***678.
UPDATE mpesa_transactions
SET details = REGEXP_REPLACE(details, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3'),
  counterparty = REGEXP_REPLACE(counterparty, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3');

UPDATE expense
SET description = REGEXP_REPLACE(description, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3'),
  merchant = REGEXP_REPLACE(merchant, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3'),
  subcategories = REGEXP_REPLACE(subcategories, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3');

UPDATE recurring_payments
SET name = REGEXP_REPLACE(name, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3');

-- Two remembered names can become one; the first one kept wins, the rest are dropped.
UPDATE IGNORE merchant_categories
SET merchant = REGEXP_REPLACE(merchant, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b', '0$2•• ••• $3');
DELETE FROM merchant_categories WHERE REGEXP_LIKE(merchant, '(\\+?254|\\b0)([17])[0-9*]{5}([0-9]{3})\\b');
