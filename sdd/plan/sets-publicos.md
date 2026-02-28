# Plan de Ejecución: Sets Públicos

**Fecha**: 2026-02-28
**Estado**: En Progreso

---

## Dependencias

- Sets deben existir en la base de datos Supabase (cargados por admin)
- Base de datos debe tener tablas: `sets`, `set_items`, `products`
- Relaciones configuradas: `sets → set_items → products`

---

## Obtención de Datos

### `/sets` (Listado)
- **Ruta**: `app/(shop)/sets/page.tsx`
- **Query**: `SELECT * FROM sets WHERE is_active = true` con relación a `category`
- **Sin API route necesaria**: Server component con `createClient()` desde `lib/supabase/server.ts`

### `/set/[slug]` (Detalle)
- **Ruta**: `app/(shop)/set/[slug]/page.tsx`
- **Query**: `SELECT * FROM sets WHERE slug = $1 AND is_active = true` con join a `set_items → products`
- **Comportamiento**: `notFound()` si set no existe o `is_active = false`
- **Filtrado**: Mostrar solo productos activos (`product.is_active = true`) dentro del set

---

## Páginas a Implementar

### 1. `/sets` — Listado de Sets

**Responsabilidades**:
- Grid de tarjetas de sets (responsive)
- Datos por tarjeta: imagen principal (primera de `images[]`), nombre, precio
- Estado vacío: mensaje informativo cuando no hay sets activos
- Componente hijo: `components/shop/SetCard.tsx`

**Validaciones**:
- ✓ Solo mostrar sets con `is_active = true`
- ✓ Manejar gracefully si `images[]` está vacío (placeholder)
- ✓ Manejar listado completamente vacío

### 2. `/set/[slug]` — Detalle del Set

**Responsabilidades**:
- Galería de imágenes (todas las del set)
- Información principal: nombre, descripción, precio
- Lista de productos incluidos: thumbnail, nombre, cantidad
- Mensaje informativo si no hay items incluidos
- Error 404 para sets inactivos o inexistentes

**Validaciones**:
- ✓ `notFound()` si set no existe o `is_active = false`
- ✓ Mostrar solo productos con `is_active = true`
- ✓ Manejar gracefully si `images[]` vacío (placeholder)
- ✓ Manejar gracefully si `set_items` vacío (mensaje)

---

## Componentes a Crear

### `components/shop/SetCard.tsx`
- Card reutilizable para el grid de sets
- Props: `set` (MateSet)
- Contenido: imagen, nombre, precio
- Link a `/set/[slug]`

---

## Deferred (MVP 2+)

- Filtrado de sets por categoría
- Agregar sets al carrito
- Funcionalidad de compra
- Stock por set
- Búsqueda y recomendaciones

---

## Checklist de Implementación

- [ ] Crear `components/shop/SetCard.tsx`
- [ ] Implementar `app/(shop)/sets/page.tsx`
- [ ] Implementar `app/(shop)/set/[slug]/page.tsx`
- [ ] Tests unitarios (cobertura ≥ 85%)
- [ ] Verificar manejo de casos edge
- [ ] Code review
- [ ] Validación contra spec.md
