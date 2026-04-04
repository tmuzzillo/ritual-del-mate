-- Migration 010: Add stock column to product_variations
-- Products without variations use products.stock (already exists).
-- Products WITH variations use product_variations.stock per variation;
-- products.stock is ignored for those products.

ALTER TABLE public.product_variations
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
