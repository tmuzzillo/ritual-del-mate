# Plan de Ejecución: MVP2 — Carrito, Stock y Checkout

**Fecha**: 2026-04-04  
**Specs**: [mvp2-ventas.md](../specs/mvp2-ventas.md) · [mvp2-ventas-tech.md](../specs/mvp2-ventas-tech.md)

---

## Orden de implementación

```
Fase A — Infraestructura DB (base para todo)
  ├── 010_variation_stock.sql
  ├── 011_orders.sql
  ├── 012_shop_config.sql
  └── 013_create_order_rpc.sql

Fase B — Stock visible en catálogo (no rompe nada existente)
  ├── Tipos TS: stock en ProductVariation
  ├── stock-badge.tsx (componente reutilizable)
  ├── Catálogo: griseado + badge en cards
  └── Fichas de producto/set: deshabilitar CTA sin stock

Fase C — Carrito
  ├── CartContext + CartProvider (localStorage)
  ├── cart-button.tsx (header)
  ├── cart-drawer.tsx
  └── /carrito page

Fase D — Checkout
  ├── /checkout page + checkout-form.tsx
  ├── POST /api/orders (llama al RPC)
  ├── stop-checkout-modal.tsx
  └── /checkout/confirmation page + order-confirmation.tsx

Fase E — Admin: Stock
  ├── Extender product-form: campo stock por variación
  └── Extender set-form: indicador de disponibilidad read-only

Fase F — Admin: Pedidos
  ├── GET /api/orders + PATCH /api/orders/[id]
  ├── /admin/pedidos page + orders-table.tsx
  └── order-detail-drawer.tsx (con selector de estado)

Fase G — Admin: Configuración de tienda
  ├── GET /api/shop-config + PATCH /api/shop-config
  └── /admin/configuracion page + shop-config-form.tsx
```

---

## Dependencias entre fases

| Fase | Depende de |
|------|-----------|
| A — DB | — |
| B — Stock en catálogo | A (campo stock en variaciones) |
| C — Carrito | B (necesita saber si hay stock para habilitar "Agregar") |
| D — Checkout | A (RPC), C (carrito armado) |
| E — Stock en admin | A |
| F — Admin pedidos | A (tablas orders/order_items) |
| G — Admin config | A (tabla shop_config) |

Fases E, F, G son independientes entre sí y se pueden hacer en paralelo tras A.

---

## Fase A — Infraestructura DB

**Archivos a crear**:
- `supabase/migrations/010_variation_stock.sql`
- `supabase/migrations/011_orders.sql`
- `supabase/migrations/012_shop_config.sql`
- `supabase/migrations/013_create_order_rpc.sql`

**Contenido**: ver sección 2 del tech spec.

**Criterio de done**: las 4 migraciones corren sin error en Supabase SQL Editor. La función `create_order` existe y es invocable.

---

## Fase B — Stock visible en catálogo

### B.1 — Tipos TS
- Agregar `stock: number` a `ProductVariation` en `types/index.ts`.
- Agregar helpers en `lib/utils/stock.ts`:
  - `isProductAvailable(product: Product): boolean`
  - `getProductMaxStock(product: Product, variationId?: string): number`
  - `isSetAvailable(setItems: SetItem[]): boolean`

### B.2 — Componente `stock-badge.tsx`
`components/shop/stock-badge.tsx` — badge "Sin stock" superpuesto (absoluto) sobre la imagen de la card.

### B.3 — Cards en catálogo (`/catalogo`)
- Envolver imagen con `relative` + `StockBadge` condicional.
- Aplicar `grayscale opacity-60` a la imagen cuando sin stock.
- Deshabilitar/ocultar el botón de acción cuando sin stock.

### B.4 — Cards en `/sets`
- Misma lógica que B.3 pero usando `isSetAvailable(set.set_items)`.

### B.5 — Ficha de producto (`/producto/[slug]`)
- Al seleccionar una variación sin stock: deshabilitar botón "Agregar al carrito" y mostrar texto "Sin stock".
- Si el producto no tiene variaciones y `stock = 0`: mismo comportamiento.

### B.6 — Ficha de set (`/set/[slug]`)
- Si el set está sin stock: mostrar mensaje y deshabilitar el botón de agregar.

**Criterio de done**: un producto con stock=0 (o todas sus variaciones en 0) se ve grisado en catálogo y no tiene CTA habilitado.

---

## Fase C — Carrito

### C.1 — CartContext
`components/shop/cart-provider.tsx`
- Hook `useCart()` expone: `items`, `addItem`, `removeItem`, `updateQuantity`, `clearCart`, `totalItems`, `totalPrice`.
- Persiste en `localStorage` bajo clave `rdm_cart`.
- `addItem` limita la cantidad al stock disponible del ítem.

### C.2 — Integrar CartProvider en layout
Wrappear `app/(shop)/layout.tsx` con `<CartProvider>`.

### C.3 — `cart-button.tsx`
`components/shop/cart-button.tsx` — ícono carrito con badge numérico. Agregar al header del storefront.

### C.4 — `cart-drawer.tsx` + `cart-item-row.tsx`
Drawer lateral (shadcn Sheet) con listado de ítems, controles de cantidad (+/−), botón eliminar y total. Botón "Ir al checkout" lleva a `/checkout`.

### C.5 — Página `/carrito`
`app/(shop)/carrito/page.tsx` — versión full-page del carrito (accesible directamente por URL). Misma lógica que el drawer.

**Criterio de done**: se puede agregar un producto y un set al carrito, modificar cantidades, eliminar ítems, y el estado persiste al navegar.

---

## Fase D — Checkout

### D.1 — API Route `POST /api/orders`
`app/api/orders/route.ts`
- Validar body con Zod.
- Llamar RPC `create_order` con Supabase service role client.
- Responder `200` con `{ order_id, order_number }` o `409` con `{ error, item_name }`.

### D.2 — `stop-checkout-modal.tsx`
`components/shop/stop-checkout-modal.tsx` — modal bloqueante con nombre del ítem sin stock, botón "Eliminar del carrito y continuar" y botón "Volver al carrito".

### D.3 — Validación client-side al entrar al checkout
En `cart-drawer.tsx` y en `/carrito/page.tsx`, al hacer clic en "Ir al checkout":
1. Re-fetch del stock de todos los ítems desde Supabase (anon key, solo SELECT).
2. Si alguno sin stock → abrir `StopCheckoutModal`.
3. Si todo OK → navegar a `/checkout`.

### D.4 — Página `/checkout`
`app/(shop)/checkout/page.tsx`
- Redirigir a `/carrito` si el carrito está vacío.
- Mostrar resumen del pedido (read-only) + `CheckoutForm`.

### D.5 — `checkout-form.tsx`
`components/shop/checkout-form.tsx`
- Campos: nombre, email, teléfono (react-hook-form + Zod).
- Al submit: `POST /api/orders`.
  - `409` → abrir `StopCheckoutModal`.
  - `200` → `clearCart()` + redirect a `/checkout/confirmation?order_number=X&total=Y`.

### D.6 — Página `/checkout/confirmation`
`app/(shop)/checkout/confirmation/page.tsx`
- Lee `order_number` y `total` de searchParams.
- Fetch de `shop_config` para datos bancarios y disclaimer.
- Renderiza `OrderConfirmation`.

### D.7 — `order-confirmation.tsx`
`components/shop/order-confirmation.tsx`
- Número de pedido destacado.
- Datos bancarios (CBU, Alias, Titular, Banco).
- Total a transferir.
- Disclaimer de envío (configurable desde `shop_config`).
- Botón "Enviar comprobante por WhatsApp" (link `wa.me/...` con mensaje pre-armado).

**Criterio de done**: flujo completo de compra — carrito → checkout → confirmación → link WhatsApp generado con número de pedido correcto.

---

## Fase E — Admin: Stock

### E.1 — Stock en product-form
`components/admin/product-form.tsx`
- **Sin variaciones**: verificar que el campo `stock` (numérico, ≥ 0) esté presente y funcional en el form. Agregarlo si no está.
- **Con variaciones**: dentro del panel de variaciones, cada variación expone un campo `stock` numérico editable.

### E.2 — Indicador de disponibilidad en set-form
`components/admin/set-form.tsx`
- Chip/badge read-only que indica si el set tiene stock disponible basado en sus items actuales.
- No es editable (el stock se gestiona desde los productos).

**Criterio de done**: el admin puede ver y editar stock desde los formularios de producto. El set muestra disponibilidad derivada.

---

## Fase F — Admin: Pedidos

### F.1 — API Routes
- `app/api/orders/route.ts` (GET) — listado paginado, solo autenticado.
- `app/api/orders/[id]/route.ts` (PATCH) — actualizar estado, solo autenticado.

### F.2 — Página `/admin/pedidos`
`app/admin/pedidos/page.tsx` — server component.
- Tabla con columnas: Nº pedido, Fecha, Comprador (nombre + email), Total, Estado.
- Ordenado por fecha descendente.

### F.3 — `orders-table.tsx`
`components/admin/orders-table.tsx`
- Filtro por estado (tabs o select).
- `OrderStatusBadge` con color por estado.

### F.4 — `order-detail-drawer.tsx`
`components/admin/order-detail-drawer.tsx`
- Detalle completo: ítems (nombre, variación, cantidad, precio unitario), datos del comprador.
- Select para cambiar estado → `PATCH /api/orders/[id]`.

### F.5 — Agregar "Pedidos" al AdminNav
`components/admin/admin-nav.tsx` — nuevo ítem de navegación.

**Criterio de done**: el admin ve todos los pedidos y puede cambiarles el estado.

---

## Fase G — Admin: Configuración de tienda

### G.1 — API Routes
- `app/api/shop-config/route.ts` (GET + PATCH) — GET público, PATCH solo autenticado.

### G.2 — Página `/admin/configuracion`
`app/admin/configuracion/page.tsx`
- Fetch de `shop_config` + render de `ShopConfigForm`.

### G.3 — `shop-config-form.tsx`
`components/admin/shop-config-form.tsx`
- Campos: CBU, Alias, Titular, Banco, Número WhatsApp, Disclaimer de envío (textarea).
- Validación Zod.
- `PATCH /api/shop-config` al guardar.

### G.4 — Agregar "Configuración" al AdminNav

**Criterio de done**: el admin puede editar datos bancarios y disclaimer sin tocar código. Los cambios se reflejan inmediatamente en la pantalla de confirmación de checkout.

---

## Checklist de QA antes de mergear

- [ ] Producto sin stock → grisado en catálogo, sin CTA
- [ ] Set con un producto sin stock → grisado en catálogo, sin CTA
- [ ] No se puede agregar al carrito más unidades que el stock disponible
- [ ] Carrito persiste al navegar entre páginas
- [ ] Validación de stock al entrar al checkout muestra StopCheckoutModal si hay cambios
- [ ] Checkout con stock OK → crea pedido en Supabase
- [ ] Checkout con race condition (stock se agota entre client-check y confirm) → muestra error correcto
- [ ] Pantalla de confirmación muestra datos bancarios desde shop_config
- [ ] Link WhatsApp incluye número de pedido y total
- [ ] Admin ve el pedido en /admin/pedidos tras la compra
- [ ] Admin puede cambiar estado del pedido
- [ ] Admin puede editar datos bancarios y el cambio se refleja en el checkout
- [ ] Stock se descuenta correctamente al confirmar (producto sin variación, con variación, set)
