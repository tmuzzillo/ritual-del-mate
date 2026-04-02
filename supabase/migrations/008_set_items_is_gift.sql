-- Mark individual set items as gifts
ALTER TABLE set_items ADD COLUMN is_gift BOOLEAN NOT NULL DEFAULT false;
