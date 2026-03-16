-- Migration 003: Add product_variations table and variation_id to set_items

CREATE TABLE IF NOT EXISTS public.product_variations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  images       TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variations_product_id ON public.product_variations(product_id);
CREATE INDEX idx_product_variations_active     ON public.product_variations(product_id, is_active, sort_order);

-- Row Level Security
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read product_variations"
  ON public.product_variations FOR SELECT
  USING (true);

CREATE POLICY "Auth write product_variations"
  ON public.product_variations FOR ALL
  USING (auth.role() = 'authenticated');

-- Agregar variation_id a set_items (nullable — NULL cuando el producto no tiene variaciones)
ALTER TABLE public.set_items
  ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES public.product_variations(id) ON DELETE SET NULL;
