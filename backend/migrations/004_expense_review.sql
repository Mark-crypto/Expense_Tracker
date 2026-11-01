-- Adds where an expense came from, a personal note, and the review queue flag.
ALTER TABLE expense
  ADD COLUMN source VARCHAR(10) NOT NULL DEFAULT 'manual',
  ADD COLUMN note VARCHAR(500) NULL,
  ADD COLUMN needs_review TINYINT(1) NOT NULL DEFAULT 0;

UPDATE expense SET source = 'mpesa' WHERE receipt_no IS NOT NULL;
UPDATE expense SET source = 'receipt' WHERE receipt_no IS NULL AND merchant IS NOT NULL;
UPDATE expense SET needs_review = 1
  WHERE source <> 'manual' AND category = 'miscellaneous' AND status = 'active';
