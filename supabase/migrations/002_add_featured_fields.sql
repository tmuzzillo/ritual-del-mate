-- Migración: 002_add_featured_fields.sql
-- Creada: 2026-02-28
-- Agrega campo `featured` a products y sets para destacarlos en la home

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.sets
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_sets_featured ON public.sets(featured);
