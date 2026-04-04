-- Migration 011: Orders and order_items tables

CREATE TABLE IF NOT EXISTS public.orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE NOT NULL,
  buyer_name   TEXT NOT NULL,
  buyer_email  TEXT NOT NULL,
  buyer_phone  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pendiente_pago'
                 CHECK (status IN ('pendiente_pago','pago_confirmado','enviado','entregado','cancelado')),
  total        DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type       TEXT NOT NULL CHECK (item_type IN ('product','set')),
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  set_id          UUID REFERENCES public.sets(id) ON DELETE SET NULL,
  variation_id    UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  item_name       TEXT NOT NULL,
  variation_label TEXT,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(10,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status     ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Anónimos pueden crear órdenes (guest checkout)
CREATE POLICY "Anon insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Solo admin puede leer y actualizar órdenes
CREATE POLICY "Auth read orders"
  ON public.orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Auth update orders"
  ON public.orders FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Anónimos pueden crear order_items (se insertan junto con la orden vía RPC)
CREATE POLICY "Anon insert order_items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Auth read order_items"
  ON public.order_items FOR SELECT
  USING (auth.role() = 'authenticated');
