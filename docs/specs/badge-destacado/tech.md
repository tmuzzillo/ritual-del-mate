# Spec Técnica: Badge Destacado en Cards

## Cambios de base de datos

### Migración: `003_add_badge_text.sql`

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT NULL;
ALTER TABLE sets     ADD COLUMN IF NOT EXISTS badge_text TEXT DEFAULT NULL;
```

Sin índices adicionales (campo de solo lectura, sin filtros).

## Cambios en tipos

`types/index.ts` — agregar `badge_text?: string | null` a `Product` y `MateSet`.

## Cambios en el admin

### Formulario de producto (`components/admin/product-form.tsx` o similar)
- Agregar `<Input>` con label "Texto destacado (opcional)" vinculado al campo `badge_text`.
- Validación Zod: `z.string().max(50).optional().nullable()`.
- En el submit: incluir `badge_text` en el objeto de upsert a Supabase.

### Formulario de set (idem, archivo de sets en admin)
- Misma adición.

## Cambios en el storefront

### Componente `BadgePill` (nuevo, pequeño — en `components/shop/badge-pill.tsx`)

```tsx
export function BadgePill({ text }: { text: string }) {
  return (
    <span className="absolute top-2 left-2 z-10 bg-brand-orange text-white 
                     text-xs font-semibold px-2 py-1 rounded-full 
                     max-w-[80%] truncate">
      {text}
    </span>
  );
}
```

### `ProductCard` — envolver imagen en `relative`, renderizar `<BadgePill>` si `badge_text`
### `SetCard` / cards de sets en carousel y colecciones — idem

## Queries afectadas

Las queries existentes de productos y sets deben incluir `badge_text` en el `select`. Como actualmente usan `select('*')` en la mayoría de los casos, no requieren cambio explícito.

Si hay queries con columnas explícitas, agregar `badge_text` a la lista.

## Orden de ejecución

1. Migración SQL en Supabase (manual via SQL Editor)
2. Actualizar `types/index.ts`
3. Componente `BadgePill`
4. Admin: product form + set form
5. Storefront: ProductCard, SetCard, carousel home, colección detail
6. Tests
