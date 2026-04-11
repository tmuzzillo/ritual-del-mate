-- Migration 015: Add per-product care text + global care text in shop_config

-- Campo opcional por producto (si tiene, sobreescribe el global)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS care_text TEXT;

-- Insertar texto de cuidado global por defecto en shop_config (key-value store)
INSERT INTO public.shop_config (key, value)
VALUES (
  'product_care_text',
  'Los mates artesanales requieren un proceso de curado antes del primer uso. Te recomendamos llenarlos con yerba húmeda durante 24 horas y secarlos bien. Evitá lavarlos con detergente y guardalos sin la bombilla para que respiren.'
)
ON CONFLICT (key) DO NOTHING;
