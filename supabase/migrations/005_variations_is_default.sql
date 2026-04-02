-- Agregar columna is_default a product_variations
ALTER TABLE product_variations ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;

-- Para cada producto con images[] propias, insertar una variación default nueva
-- con label = nombre del producto y sort_order = -1 para que quede primera
INSERT INTO product_variations (product_id, label, images, is_active, is_default, sort_order)
SELECT id, name, images, true, true, -1
FROM products
WHERE array_length(images, 1) > 0;

-- Para productos sin images[] pero con variaciones activas, marcar la primera como default
UPDATE product_variations
SET is_default = true
WHERE id IN (
  SELECT DISTINCT ON (product_id) id
  FROM product_variations
  WHERE is_active = true
  ORDER BY product_id, sort_order ASC, created_at ASC
)
AND product_id NOT IN (
  SELECT product_id FROM product_variations WHERE is_default = true
);
