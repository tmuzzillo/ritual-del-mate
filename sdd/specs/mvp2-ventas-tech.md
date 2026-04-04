# Technical Specification: MVP2 — Carrito, Stock y Checkout

**Created**: 2026-04-04  
**Functional spec**: [mvp2-ventas.md](./mvp2-ventas.md)

---

## 1. Arquitectura general

El flujo completo es client-side hasta el momento de confirmar el pedido, donde una API Route de Next.js ejecuta la transacción atómica de creación de orden + descuento de stock en Supabase.

```
[localStorage Cart] → [/checkout page] → [POST /api/orders] → [Supabase transaction]
                                                                      ↓
                                                          [confirmation screen + WhatsApp link]
```

El carrito nunca toca la base de datos. La única escritura ocurre al confirmar el pedido.

---

## 2. Migraciones de base de datos

### 010 — Stock en variaciones

```sql
ALTER TABLE public.product_variations
  ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
```

**Nota**: `products.stock` sigue existiendo y se usa para productos sin variaciones. Para productos con variaciones, `products.stock` se ignora — la fuente de verdad es `product_variations.stock`.

### 011 — Tablas de órdenes

```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number   SERIAL UNIQUE NOT NULL,
  buyer_name     TEXT NOT NULL,
  buyer_email    TEXT NOT NULL,
  buyer_phone    TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pendiente_pago'
                   CHECK (status IN ('pendiente_pago','pago_confirmado','enviado','entregado','cancelado')),
  total          DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_type      TEXT NOT NULL CHECK (item_type IN ('product','set')),
  product_id     UUID REFERENCES public.products(id) ON DELETE SET NULL,
  set_id         UUID REFERENCES public.sets(id) ON DELETE SET NULL,
  variation_id   UUID REFERENCES public.product_variations(id) ON DELETE SET NULL,
  item_name      TEXT NOT NULL,        -- snapshot del nombre al momento de la compra
  variation_label TEXT,               -- snapshot del label de la variación
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_status     ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- RLS: órdenes solo visibles para el admin (authenticated)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon insert orders"   ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth read orders"     ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Auth update orders"   ON public.orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Anon insert order_items"  ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth read order_items"    ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
```

### 012 — Configuración de la tienda

```sql
CREATE TABLE IF NOT EXISTS public.shop_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE public.shop_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read shop_config"  ON public.shop_config FOR SELECT USING (true);
CREATE POLICY "Auth write shop_config"   ON public.shop_config FOR ALL USING (auth.role() = 'authenticated');

-- Valores iniciales (completar antes de ir a producción)
INSERT INTO public.shop_config (key, value) VALUES
  ('bank_cbu',       ''),
  ('bank_alias',     ''),
  ('bank_owner',     ''),
  ('bank_name',      ''),
  ('whatsapp_number',''),
  ('shipping_disclaimer', 'El envío se coordina por WhatsApp. Los tiempos de entrega son de 5 a 10 días hábiles y el costo se abona por separado según tu ubicación.')
ON CONFLICT (key) DO NOTHING;
```

### 013 — Función RPC para creación atómica de orden

Para evitar race conditions en el descuento de stock, se usa una función PostgreSQL que ejecuta validación + descuento + creación de orden en una sola transacción.

```sql
CREATE OR REPLACE FUNCTION public.create_order(
  p_buyer_name  TEXT,
  p_buyer_email TEXT,
  p_buyer_phone TEXT,
  p_total       DECIMAL,
  p_items       JSONB   -- array de { item_type, product_id?, set_id?, variation_id?, item_name, variation_label?, quantity, unit_price }
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
  -- 1. Validar stock de cada ítem antes de crear nada
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'item_type') = 'product' THEN
      -- Producto con variación
      IF (v_item->>'variation_id') IS NOT NULL THEN
        SELECT stock INTO v_stock
          FROM product_variations
         WHERE id = (v_item->>'variation_id')::UUID
           FOR UPDATE;
        IF v_stock < (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;
      ELSE
        -- Producto sin variación
        SELECT stock INTO v_stock
          FROM products
         WHERE id = (v_item->>'product_id')::UUID
           FOR UPDATE;
        IF v_stock < (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;
      END IF;

    ELSIF (v_item->>'item_type') = 'set' THEN
      -- Validar stock de cada producto del set
      FOR v_set_item IN
        SELECT si.product_id, si.variation_id, si.quantity
          FROM set_items si
         WHERE si.set_id = (v_item->>'set_id')::UUID
      LOOP
        IF v_set_item.variation_id IS NOT NULL THEN
          SELECT stock INTO v_stock
            FROM product_variations
           WHERE id = v_set_item.variation_id
             FOR UPDATE;
        ELSE
          SELECT stock INTO v_stock
            FROM products
           WHERE id = v_set_item.product_id
             FOR UPDATE;
        END IF;
        IF v_stock < v_set_item.quantity * (v_item->>'quantity')::INTEGER THEN
          RETURN jsonb_build_object('error', 'stock_insuficiente', 'item_name', v_item->>'item_name');
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- 2. Crear la orden
  INSERT INTO public.orders (buyer_name, buyer_email, buyer_phone, total)
  VALUES (p_buyer_name, p_buyer_email, p_buyer_phone, p_total)
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 3. Crear los order_items y descontar stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items
      (order_id, item_type, product_id, set_id, variation_id, item_name, variation_label, quantity, unit_price)
    VALUES (
      v_order_id,
      v_item->>'item_type',
      CASE WHEN (v_item->>'product_id') IS NOT NULL THEN (v_item->>'product_id')::UUID END,
      CASE WHEN (v_item->>'set_id') IS NOT NULL THEN (v_item->>'set_id')::UUID END,
      CASE WHEN (v_item->>'variation_id') IS NOT NULL THEN (v_item->>'variation_id')::UUID END,
      v_item->>'item_name',
      v_item->>'variation_label',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL
    );

    -- Descontar stock
    IF (v_item->>'item_type') = 'product' THEN
      IF (v_item->>'variation_id') IS NOT NULL THEN
        UPDATE product_variations
           SET stock = stock - (v_item->>'quantity')::INTEGER
         WHERE id = (v_item->>'variation_id')::UUID;
      ELSE
        UPDATE products
           SET stock = stock - (v_item->>'quantity')::INTEGER
         WHERE id = (v_item->>'product_id')::UUID;
      END IF;

    ELSIF (v_item->>'item_type') = 'set' THEN
      FOR v_set_item IN
        SELECT si.product_id, si.variation_id, si.quantity
          FROM set_items si
         WHERE si.set_id = (v_item->>'set_id')::UUID
      LOOP
        IF v_set_item.variation_id IS NOT NULL THEN
          UPDATE product_variations
             SET stock = stock - v_set_item.quantity * (v_item->>'quantity')::INTEGER
           WHERE id = v_set_item.variation_id;
        ELSE
          UPDATE products
             SET stock = stock - v_set_item.quantity * (v_item->>'quantity')::INTEGER
           WHERE id = v_set_item.product_id;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
END;
$$;
```

---

## 3. Tipos TypeScript

Extensiones a [types/index.ts](../../types/index.ts):

```ts
// Extensión de ProductVariation — agregar campo stock
// stock: number  (ya existe el campo en DB tras la migración 010)

// Nuevos tipos

export type OrderStatus =
  | 'pendiente_pago'
  | 'pago_confirmado'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export interface Order {
  id: string
  order_number: number
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  status: OrderStatus
  total: number
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  item_type: 'product' | 'set'
  product_id: string | null
  set_id: string | null
  variation_id: string | null
  item_name: string
  variation_label: string | null
  quantity: number
  unit_price: number
}

// Carrito (solo en cliente, no persiste en DB)
export interface CartItem {
  id: string                    // product_id o set_id
  item_type: 'product' | 'set'
  name: string
  image: string
  price: number
  quantity: number
  variation_id?: string
  variation_label?: string
  // Para sets: snapshot de los product_ids necesarios para validar stock client-side
  set_product_ids?: string[]
}

export interface ShopConfig {
  bank_cbu: string
  bank_alias: string
  bank_owner: string
  bank_name: string
  whatsapp_number: string
  shipping_disclaimer: string
}
```

---

## 4. API Routes

### `POST /api/orders`

**Propósito**: Crear un pedido. Llama al RPC `create_order` de Supabase.  
**Auth**: Pública (anonymous checkout).  
**Body**:
```ts
{
  buyer_name: string
  buyer_email: string
  buyer_phone: string
  total: number
  items: Array<{
    item_type: 'product' | 'set'
    product_id?: string
    set_id?: string
    variation_id?: string
    item_name: string
    variation_label?: string
    quantity: number
    unit_price: number
  }>
}
```
**Respuestas**:
- `200` → `{ order_id, order_number }`
- `409` → `{ error: 'stock_insuficiente', item_name }` — el cliente muestra el stop checkout
- `400` → errores de validación del body
- `500` → error interno

**Implementación**: usa el cliente de Supabase con `service_role` key (variable de entorno `SUPABASE_SERVICE_ROLE_KEY`) para ejecutar el RPC sin restricciones de RLS en la escritura anónima de órdenes.

### `GET /api/orders` *(admin)*

Listado paginado de órdenes. Solo desde server component del admin, usando el cliente server con cookie de sesión autenticada.

### `PATCH /api/orders/[id]` *(admin)*

Actualizar estado de un pedido. Body: `{ status: OrderStatus }`.

### `GET /api/shop-config` *(público)*

Devuelve todos los valores de `shop_config` como objeto `ShopConfig`.

### `PATCH /api/shop-config` *(admin)*

Actualiza uno o más valores de configuración. Body: `Partial<ShopConfig>`.

---

## 5. Estructura de componentes y rutas

### Rutas nuevas (shop)

```
app/(shop)/carrito/
  page.tsx                  — CartPage (client component)

app/(shop)/checkout/
  page.tsx                  — CheckoutPage (client component)
  confirmation/
    page.tsx                — OrderConfirmationPage (recibe order_number + total via searchParams)
```

### Rutas nuevas (admin)

```
app/admin/pedidos/
  page.tsx                  — OrdersPage (server component, tabla de órdenes)
  [id]/
    page.tsx                — OrderDetailPage (server component + client state update)

app/admin/configuracion/
  page.tsx                  — ShopConfigPage (client component con form)
```

### Componentes nuevos

```
components/shop/
  cart-button.tsx           — Ícono carrito con badge de cantidad (accede a CartContext)
  cart-drawer.tsx           — Drawer lateral que muestra el resumen del carrito
  cart-item-row.tsx         — Fila de ítem dentro del carrito
  stock-badge.tsx           — Badge "Sin stock" superpuesto sobre imágenes en catálogo
  stop-checkout-modal.tsx   — Modal bloqueante cuando un ítem pierde stock al iniciar checkout
  checkout-form.tsx         — Formulario de datos del comprador (react-hook-form + zod)
  order-confirmation.tsx    — Pantalla final con datos bancarios + link WhatsApp

components/admin/
  orders-table.tsx          — Tabla de pedidos con filtro por estado
  order-status-badge.tsx    — Badge visual de estado del pedido
  order-detail-drawer.tsx   — Drawer con detalle completo + selector de estado
  shop-config-form.tsx      — Formulario de configuración bancaria + disclaimer
```

### CartContext

Contexto global en `components/shop/cart-provider.tsx`, wrappea `(shop)/layout.tsx`.

Responsabilidades:
- Leer/escribir `localStorage` bajo la clave `rdm_cart`
- Exponer: `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`
- `addItem` recibe un `CartItem` y respeta el límite de stock (no permite cantidad > stock disponible)

---

## 6. Lógica de stock client-side

### Disponibilidad de un producto
```
if (product.variations && product.variations.length > 0)
  disponible = variations.some(v => v.is_active && v.stock > 0)
else
  disponible = product.stock > 0
```

### Disponibilidad de un set
Requiere que todos los `set_items` tengan stock ≥ `set_item.quantity`:
```
for each set_item:
  if set_item.variation_id:
    stock_disponible = set_item.variation.stock >= set_item.quantity
  else:
    stock_disponible = set_item.product.stock >= set_item.quantity
disponible = ALL set_items son stock_disponible
```

### Stock máximo seleccionable por ítem en carrito
```
if variation_id: max = variation.stock
else: max = product.stock
```
Para sets, el máximo es el mínimo entre todos los stocks de sus items dividido su quantity correspondiente.

---

## 7. Flujo de checkout

1. Usuario en `/carrito` hace clic en "Ir al checkout"
2. **Validación client-side**: re-fetch de stock de todos los ítems del carrito desde Supabase
   - Si algún ítem no tiene stock: mostrar `StopCheckoutModal` con el ítem afectado
   - Si todo OK: redirigir a `/checkout`
3. Usuario completa el formulario (nombre, email, teléfono) y hace clic en "Confirmar pedido"
4. `POST /api/orders` con los datos del carrito + comprador
   - Si `409 stock_insuficiente`: mostrar `StopCheckoutModal` y limpiar el ítem del carrito
   - Si `200`: limpiar carrito del localStorage, redirigir a `/checkout/confirmation?order_number=XXX&total=YYY`
5. Pantalla de confirmación muestra datos bancarios + disclaimer + botón WhatsApp

### Link de WhatsApp
```
https://wa.me/{whatsapp_number}?text=Hola!%20Acabo%20de%20realizar%20el%20pedido%20%23{order_number}%20por%20%24{total}.%20Te%20env%C3%ADo%20el%20comprobante%20de%20la%20transferencia.
```

---

## 8. Cambios en formularios admin existentes

### Formulario de producto (`components/admin/product-form.tsx`)
- **Sin variaciones**: campo `stock` numérico (ya existe en el modelo, verificar que esté en el form).
- **Con variaciones**: cada variación en el panel de variaciones expone un campo `stock` numérico propio.

### Formulario de set (`components/admin/set-form.tsx`)
- El set no tiene stock propio. Mostrar un indicador read-only de "Disponibilidad" basado en el stock actual de sus items (útil para que el admin sepa si el set está vendible sin tener que revisar cada producto).

---

## 9. Validaciones de formulario (Zod)

```ts
// Checkout
const checkoutSchema = z.object({
  buyer_name:  z.string().min(2, 'Ingresá tu nombre completo'),
  buyer_email: z.string().email('Email inválido'),
  buyer_phone: z.string().min(8, 'Teléfono inválido'),
})

// ShopConfig admin
const shopConfigSchema = z.object({
  bank_cbu:             z.string().min(1),
  bank_alias:           z.string().min(1),
  bank_owner:           z.string().min(1),
  bank_name:            z.string().min(1),
  whatsapp_number:      z.string().regex(/^\d+$/, 'Solo números, sin + ni espacios'),
  shipping_disclaimer:  z.string().min(10),
})
```

---

## 10. Plan de migraciones

| # | Archivo | Contenido |
|---|---------|-----------|
| 010 | `010_variation_stock.sql` | ADD COLUMN stock a product_variations |
| 011 | `011_orders.sql` | Tablas orders + order_items + RLS |
| 012 | `012_shop_config.sql` | Tabla shop_config + seed de claves |
| 013 | `013_create_order_rpc.sql` | Función create_order (RPC) |

---

## 11. Consideraciones de seguridad

- El RPC `create_order` se ejecuta con `SECURITY DEFINER` para que el usuario anónimo pueda escribir órdenes sin exponer permisos de escritura directo sobre `orders` a través del cliente.
- El endpoint `POST /api/orders` usa `SUPABASE_SERVICE_ROLE_KEY` (solo server-side, nunca expuesto al cliente).
- La llave `NEXT_PUBLIC_SUPABASE_ANON_KEY` del cliente solo tiene permiso de SELECT sobre `orders` deshabilitado por RLS — un visitante no puede leer pedidos de otros.
- Los datos bancarios se leen desde `shop_config` (tabla pública de solo lectura para anónimos), no desde variables de entorno, para permitir edición desde admin sin redeploy.

---

## 12. Out of scope técnico

- Webhooks de pago (MVP3)
- Cálculo de costos de envío por API (MVP3)
- Autenticación de compradores / sesiones de compra (MVP3)
- Envío de emails transaccionales (MVP3)
- Paginación del listado de órdenes (se puede agregar cuando el volumen lo justifique)
