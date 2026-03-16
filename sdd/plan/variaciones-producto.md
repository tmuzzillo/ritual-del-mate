# Technical Plan: Variaciones de Producto

**Created**: 2026-03-15
**Status**: Spec aprobado — pendiente de implementación

---

## DB Migration

```sql
-- Tabla de variaciones
CREATE TABLE product_variations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  images       TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active    BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  -- Reservado para MVP 2 (stock management):
  -- stock     INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX idx_product_variations_active ON product_variations(product_id, is_active, sort_order);

-- Vincular variación a set_items
ALTER TABLE set_items
  ADD COLUMN variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL;
```

**RLS (Row Level Security)**:
- `SELECT`: público (anon role)
- `INSERT`, `UPDATE`, `DELETE`: solo rol `authenticated`

---

## Type System (`types/index.ts`)

```typescript
export interface ProductVariation {
  id: string;
  product_id: string;
  label: string;
  images: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

// Extender Product para incluir variaciones cuando se cargan
export interface Product {
  // ...campos existentes...
  variations?: ProductVariation[]; // cargado opcionalmente (solo en VIP y admin detail)
}

// Extender SetItem para variation
export interface SetItem {
  // ...campos existentes...
  variation_id?: string | null;
  variation?: ProductVariation | null; // joined en queries de set detail
}
```

---

## API Routes

### `/api/products/[id]/variations` (nuevo)
- `GET` — lista variaciones activas de un producto (público)
- `POST` — crea nueva variación (auth required)

### `/api/variations/[id]` (nuevo)
- `PUT` — edita label, images, is_active, sort_order (auth required)
- `DELETE` — elimina variación, valida que no esté en ningún set_item activo (auth required)

### `/api/products/[id]` (existente, extender)
- `GET` — incluir `variations` en la respuesta cuando `?include=variations`

---

## Admin UI

### `ProductFormDialog` — sección de variaciones
Agregar debajo del bloque de imágenes un panel colapsable "Variaciones":
- Lista de variaciones existentes (label + thumbnail de images[0] + toggle activo + botón editar + botón eliminar)
- Botón "Agregar variación" abre un sub-formulario inline:
  - Campo label (texto)
  - `ImageUploader` con `folder="variations"` y `maxImages=7`
  - Botón Guardar / Cancelar
- Reorden via flechas ↑↓ (no drag & drop en MVP)

### `SetFormDialog` — selector de variación
Cuando el admin selecciona un producto al agregar items:
1. Cargar variaciones activas del producto
2. Si tiene variaciones → mostrar un `<select>` o lista de chips para elegir una
3. Si no tiene → flujo actual sin cambios

---

## Storefront

### `/app/(shop)/producto/[slug]/page.tsx`
- Server component ya carga el producto. Agregar: `supabase.from('product_variations').select('*').eq('product_id', product.id).eq('is_active', true).order('sort_order')`
- Pasar `variations` al componente cliente `VariationSelector`

### Nuevo componente: `components/shop/variation-selector.tsx`
Props: `variations: ProductVariation[]`, `onSelect: (variation: ProductVariation | null) => void`
- Client component
- Muestra chips: imagen (64x64, object-contain, bg-brand-cream) + label debajo
- Estado interno: `selected: string | null` (variation id)
- Al hacer clic en chip activo → deseleccionar (null)
- Diseño: flex-wrap, gap-2, chips con border-brand-terracotta si activo

### `ImageGallery` — sin cambios de contrato
La VIP ya usa `ImageGallery`. Simplemente se cambia el prop `images` desde el componente padre según la variación seleccionada:
```tsx
// En la VIP:
const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
const galleryImages = selectedVariation?.images?.length
  ? selectedVariation.images
  : product.images;
<ImageGallery images={galleryImages} name={product.name} />
<VariationSelector variations={variations} onSelect={setSelectedVariation} />
```

### `ProductCard` — fallback de imagen
Lógica de cover image:
```typescript
const coverImage = product.images[0]
  ?? product.variations?.find(v => v.is_active && v.images[0])?.images[0]
  ?? null;
```
Requiere que las queries del catálogo incluyan `variations` (solo `images[0]` para no sobrecargar).
**Alternativa más eficiente**: agregar columna computed `cover_image TEXT` al producto que el admin actualiza manualmente. Evaluar en implementación.

### `/app/(shop)/set/[slug]/page.tsx`
Query de set_items debe hacer JOIN con `product_variations` para mostrar la imagen de la variación en la lista de items del set.

---

## Queries Supabase

```typescript
// VIP — cargar producto con variaciones
const { data: product } = await supabase
  .from('products')
  .select('*, category:categories(*), variations:product_variations(id, label, images, is_active, sort_order)')
  .eq('slug', slug)
  .eq('is_active', true)
  .single();

// Set detail — items con variación
const { data: items } = await supabase
  .from('set_items')
  .select('*, product:products(id, name, slug, images), variation:product_variations(id, label, images)')
  .eq('set_id', setId)
  .order('sort_order');

// Catálogo — solo cover image de primera variación (si no tiene imagen padre)
// Opción: incluir variaciones en el SELECT con limit(1)
// Evaluar en implementación si conviene columna cover_image en products
```

---

## Consideraciones para MVP 2 (stock)

Cuando llegue el momento, la migración solo necesita:
```sql
ALTER TABLE product_variations ADD COLUMN stock INTEGER NOT NULL DEFAULT 0;
```
No hay cambios destructivos. El campo `is_active` puede mantenerse como flag manual o derivarse de `stock > 0` según el negocio lo decida.

---

## Testing Checklist

- [ ] Crear variación desde admin → aparece en VIP
- [ ] Seleccionar variación en VIP → galería cambia sin reload
- [ ] Deseleccionar variación → galería vuelve a imágenes del padre
- [ ] Variación sin imágenes → fallback a imágenes del padre
- [ ] Card en catálogo → no cambia con variaciones (muestra imagen padre)
- [ ] Agregar producto con variaciones a un set → aparece selector de variación
- [ ] Set detail → muestra imagen de la variación elegida
- [ ] Desactivar variación → no aparece en VIP, sigue en admin
- [ ] Eliminar variación vinculada a set → error con advertencia
- [ ] Eliminar variación no vinculada → se borra de DB y Storage

---

## Impacto en Specs Existentes

| Spec                   | Cambio requerido |
|------------------------|------------------|
| `gestion-productos.md` | Agregar US de gestión de variaciones (FR nuevo) |
| `gestion-sets.md`      | Actualizar US de agregar items: flujo con selector de variación |
| `catalogo-publico.md`  | Actualizar US de product card: fallback a variación |
| `sets-publicos.md`     | Actualizar US de set detail: mostrar variación en items list |
