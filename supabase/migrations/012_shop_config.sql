-- Migration 012: Shop configuration table
-- Stores key-value pairs editable by admin: bank data, shipping disclaimer, WhatsApp number.

CREATE TABLE IF NOT EXISTS public.shop_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

ALTER TABLE public.shop_config ENABLE ROW LEVEL SECURITY;

-- Lectura pública (datos bancarios se muestran en el checkout a compradores anónimos)
CREATE POLICY "Public read shop_config"
  ON public.shop_config FOR SELECT
  USING (true);

-- Solo admin puede escribir
CREATE POLICY "Auth write shop_config"
  ON public.shop_config FOR ALL
  USING (auth.role() = 'authenticated');

-- Seed con las claves esperadas (valores vacíos — el admin los completa desde /admin/configuracion)
INSERT INTO public.shop_config (key, value) VALUES
  ('bank_cbu',            ''),
  ('bank_alias',          ''),
  ('bank_owner',          ''),
  ('bank_name',           ''),
  ('whatsapp_number',     '543535104448'),
  ('shipping_disclaimer', 'El envío se coordina por WhatsApp. Los tiempos de entrega son de 5 a 10 días hábiles y el costo se abona por separado según tu ubicación.')
ON CONFLICT (key) DO NOTHING;
