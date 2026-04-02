-- Add sort_order to categories for custom display ordering
ALTER TABLE categories ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Index for ordered queries
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
