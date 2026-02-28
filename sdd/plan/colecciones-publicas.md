# Plan de Ejecución: Colecciones Públicas

**Fecha**: 2026-02-28
**Sprint**: MVP 1
**Prioridad**: P1/P2

---

## 1. Dependencias

### Prerequisitos
- Base de datos: Tablas `collections`, `collection_products`, `collection_sets` deben existir y estar pobladas con datos de prueba
- Datos iniciales: Al menos 2-3 colecciones activas (is_active = true) con productos y sets asignados
- Componentes existentes: `ProductCard`, `SetCard` disponibles en `components/shop/`
- Supabase client: `createClient()` configurado en `lib/supabase/server.ts`

### Estado actual
- Rutas `/colecciones` y `/colecciones/[slug]` **no existen**
- Componente `CollectionCard` **no existe** y debe ser creado

---

## 2. Fetching de Datos

### Página Listado: `app/(shop)/colecciones/page.tsx`
**Query**:
```sql
SELECT id, name, slug, description, images, is_active
FROM collections
WHERE is_active = true
ORDER BY created_at DESC
```

**Validaciones**:
- Si no hay colecciones activas → mostrar empty state informativo

### Página Detalle: `app/(shop)/colecciones/[slug]/page.tsx`
**Query**:
```sql
SELECT c.id, c.name, c.slug, c.description, c.images, c.is_active,
       json_agg(DISTINCT p.*) as products,
       json_agg(DISTINCT s.*) as sets
FROM collections c
LEFT JOIN collection_products cp ON c.id = cp.collection_id
LEFT JOIN products p ON cp.product_id = p.id AND p.is_active = true
LEFT JOIN collection_sets cs ON c.id = cs.collection_id
LEFT JOIN mate_sets s ON cs.set_id = s.id AND s.is_active = true
WHERE c.slug = $1 AND c.is_active = true
GROUP BY c.id, c.name, c.slug, c.description, c.images, c.is_active
```

**Validaciones**:
- Si collection es null → `notFound()`
- Si collection.is_active = false → `notFound()`
- Filtrar productos/sets inactivos del resultado
- Si todos los items están inactivos → mostrar mensaje informativo (no 404)
- Si no hay imagen → usar placeholder

---

## 3. Archivos a Crear

### 3.1 Páginas

#### `app/(shop)/colecciones/page.tsx`
- **Responsabilidad**: Listar todas las colecciones activas
- **Componentes usados**: `CollectionCard` (nuevo)
- **Estructura**:
  - Server component
  - Fetch collections donde is_active = true
  - Renderizar grid de colecciones
  - Empty state si no hay resultados
- **Metadata**: title "Colecciones", description dinámico
- **Error handling**: Mostrar fallback si query falla

#### `app/(shop)/colecciones/[slug]/page.tsx`
- **Responsabilidad**: Mostrar detalle de una colección y sus items
- **Componentes usados**: `ProductCard`, `SetCard` (existentes)
- **Estructura**:
  - Server component con parámetro dinámico `slug`
  - Fetch collection by slug (con join a products y sets)
  - `notFound()` si collection null o inactiva
  - Header con imagen/banner, nombre y descripción
  - Grid mixto de productos y sets activos
  - Mensaje informativo si no hay items activos
- **Metadata**: title dinámico "[Collection Name] - Colecciones", description
- **Slug validation**: URL-safe slug handling

### 3.2 Componentes

#### `components/shop/CollectionCard.tsx`
- **Props**:
  ```ts
  interface CollectionCardProps {
    id: string
    name: string
    slug: string
    description?: string
    images?: string[]
  }
  ```
- **Estructura**:
  - Tarjeta visual con imagen principal (o placeholder)
  - Nombre de la colección
  - Descripción truncada (máx 100 caracteres con "...")
  - Link a `/colecciones/[slug]`
  - Hover effect
- **Styling**: Tailwind CSS v4, coherente con otros cards del proyecto
- **Accessibility**: Atributo alt en imágenes, semantic HTML

---

## 4. Flujo de Implementación

### Fase 1: Setup (30 min)
1. Crear estructura de directorios `/colecciones` en `app/(shop)/`
2. Verificar tipo `Collection` en tipos globales (crear si no existe)
3. Confirmar conexión Supabase con tablas `collections`, `collection_products`, `collection_sets`

### Fase 2: Componente Base (45 min)
1. Crear `CollectionCard.tsx` con estilos Tailwind
2. Pruebas visuales: renderizar con diferentes longitudes de texto
3. Validar placeholder de imágenes faltantes

### Fase 3: Página Listado (1h)
1. Crear `app/(shop)/colecciones/page.tsx`
2. Implementar fetch de colecciones activas
3. Render grid de `CollectionCard`
4. Empty state cuando no hay colecciones
5. Metadata y SEO

### Fase 4: Página Detalle (1.5h)
1. Crear `app/(shop)/colecciones/[slug]/page.tsx`
2. Implementar fetch by slug con joins a products/sets
3. Filtrar items inactivos
4. Renders condicionales: header, grid items, mensaje si vacío
5. `notFound()` para colecciones inexistentes o inactivas
6. Metadata dinámico

### Fase 5: Testing (1h)
1. Probar listado vacío
2. Probar detalle con múltiples productos y sets
3. Probar detalle con items inactivos
4. Probar 404 para slug inexistente
5. Probar 404 para colección inactiva
6. Probar placeholder de imágenes

### Fase 6: Code Review & QA (30 min)
1. Validar cobertura de código >= 85%
2. Verificar retrocompatibilidad con estructura MVP 1
3. Performance: validar que queries cargan < 1s

---

## 5. Consideraciones Técnicas

### Performance
- Server components para render en servidor
- Supabase queries optimizadas con índices en `slug` e `is_active`
- Caché de imágenes via CDN

### UX
- Placeholder visual para imágenes faltantes
- Mensajes claros en estados vacíos
- Consistencia visual con otros componentes del shop

### Edge Cases Cubiertos
- Colección sin imagen → placeholder
- Colección sin descripción → campo vacío/omitido
- Todos los items inactivos → mensaje informativo
- Item en múltiples colecciones → no duplicar (via LEFT JOIN)
- Slugs con caracteres especiales → validar URL-safety

---

## 6. Criteria de Éxito

- [x] `/colecciones` lista todas las colecciones activas (< 1s)
- [x] `/colecciones/[slug]` muestra productos y sets activos sin duplicados
- [x] 404 apropiado para colecciones inexistentes/inactivas
- [x] No se muestran items inactivos
- [x] Cobertura >= 85%
- [x] Componentes reutilizables (CollectionCard, reuso de ProductCard/SetCard)
- [x] Retrocompatible con MVP 1

---

## 7. Out of Scope (MVP 2)

- Filtrado por categoría/precio dentro de colección
- Carrito/compra desde página de colección
- Búsqueda dentro de colecciones
- Reorden manual de colecciones (usar created_at)
