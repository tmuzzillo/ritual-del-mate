-- Migration 013: Atomic order creation RPC
-- Validates stock, creates order + order_items, and decrements stock in a single transaction.
-- Uses SECURITY DEFINER so anonymous users can execute it without direct write access to tables.
-- Returns: { order_id, order_number } on success, or { error, item_name } on stock failure.

CREATE OR REPLACE FUNCTION public.create_order(
  p_buyer_name  TEXT,
  p_buyer_email TEXT,
  p_buyer_phone TEXT,
  p_total       DECIMAL,
  p_items       JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id     UUID;
  v_order_number INTEGER;
  v_item         JSONB;
  v_stock        INTEGER;
  v_set_item     RECORD;
BEGIN
  -- -------------------------------------------------------
  -- 1. Validar stock de todos los ítems antes de crear nada
  -- -------------------------------------------------------
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'item_type') = 'product' THEN

      IF (v_item->>'variation_id') IS NOT NULL THEN
        SELECT stock INTO v_stock
          FROM public.product_variations
         WHERE id = (v_item->>'variation_id')::UUID
           FOR UPDATE;

        IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;

      ELSE
        SELECT stock INTO v_stock
          FROM public.products
         WHERE id = (v_item->>'product_id')::UUID
           FOR UPDATE;

        IF v_stock IS NULL OR v_stock < (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;
      END IF;

    ELSIF (v_item->>'item_type') = 'set' THEN

      FOR v_set_item IN
        SELECT si.product_id, si.variation_id, si.quantity
          FROM public.set_items si
         WHERE si.set_id = (v_item->>'set_id')::UUID
      LOOP
        IF v_set_item.variation_id IS NOT NULL THEN
          SELECT stock INTO v_stock
            FROM public.product_variations
           WHERE id = v_set_item.variation_id
             FOR UPDATE;
        ELSE
          SELECT stock INTO v_stock
            FROM public.products
           WHERE id = v_set_item.product_id
             FOR UPDATE;
        END IF;

        IF v_stock IS NULL OR v_stock < v_set_item.quantity * (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;
      END LOOP;

    END IF;
  END LOOP;

  -- -------------------------------------------------------
  -- 2. Crear la orden
  -- -------------------------------------------------------
  INSERT INTO public.orders (buyer_name, buyer_email, buyer_phone, total)
  VALUES (p_buyer_name, p_buyer_email, p_buyer_phone, p_total)
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- -------------------------------------------------------
  -- 3. Insertar order_items y descontar stock
  -- -------------------------------------------------------
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items
      (order_id, item_type, product_id, set_id, variation_id,
       item_name, variation_label, quantity, unit_price)
    VALUES (
      v_order_id,
      v_item->>'item_type',
      CASE WHEN (v_item->>'product_id') IS NOT NULL THEN (v_item->>'product_id')::UUID ELSE NULL END,
      CASE WHEN (v_item->>'set_id')     IS NOT NULL THEN (v_item->>'set_id')::UUID     ELSE NULL END,
      CASE WHEN (v_item->>'variation_id') IS NOT NULL THEN (v_item->>'variation_id')::UUID ELSE NULL END,
      v_item->>'item_name',
      v_item->>'variation_label',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL
    );

    IF (v_item->>'item_type') = 'product' THEN

      IF (v_item->>'variation_id') IS NOT NULL THEN
        UPDATE public.product_variations
           SET stock = stock - (v_item->>'quantity')::INTEGER
         WHERE id = (v_item->>'variation_id')::UUID;
      ELSE
        UPDATE public.products
           SET stock = stock - (v_item->>'quantity')::INTEGER
         WHERE id = (v_item->>'product_id')::UUID;
      END IF;

    ELSIF (v_item->>'item_type') = 'set' THEN

      FOR v_set_item IN
        SELECT si.product_id, si.variation_id, si.quantity
          FROM public.set_items si
         WHERE si.set_id = (v_item->>'set_id')::UUID
      LOOP
        IF v_set_item.variation_id IS NOT NULL THEN
          UPDATE public.product_variations
             SET stock = stock - v_set_item.quantity * (v_item->>'quantity')::INTEGER
           WHERE id = v_set_item.variation_id;
        ELSE
          UPDATE public.products
             SET stock = stock - v_set_item.quantity * (v_item->>'quantity')::INTEGER
           WHERE id = v_set_item.product_id;
        END IF;
      END LOOP;

    END IF;
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;
