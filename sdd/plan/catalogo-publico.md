# Plan de Ejecución: Catálogo Público

**Created**: 2026-02-28

---

## Dependencias

### Pre-requisitos
- Base de datos Supabase con tablas configuradas:
  - `categories` (id, name, slug, created_at)
  - `products` (id, name, slug, description, price, images[], category_id, is_active, created_at)
  - Relación foreign key: `products.category_id` → `categories.id`
- Datos iniciales: al menos una categoría y un producto activo ya cargados en BD (responsabilidad del admin)
- Rutas públicas ya existen como archivos vacíos:
  - `app/(shop)/catalogo/page.tsx`
  - `app/(shop)/producto/[slug]/page.tsx`

---

## API / Data Fetching

### Estrategia General
- **No se crean API routes** para lecturas públicas; se utiliza el Supabase server client directamente en Server Components
- Cliente Supabase: `createClient()` desde `lib/supabase/server.ts`
- Todas las queries deben filtrar por `is_active = true`
- Las queries incluyen join con `categories` para obtener nombre y slug de la categoría

### Queries Específicas

#### 1. Listar productos activos (con filtro por categoría opcional)
**Ubicación**: `app/(shop)/catalogo/page.tsx`
```
Query Base:
SELECT products.*, categories.name as category_name, categories.slug as category_slug
FROM products
JOIN categories ON products.category_id = categories.id
WHERE products.is_active = true
ORDER BY products.created_at DESC

Query con Filtro (parámetro ?categoria=slug):
... AND categories.slug = $1
```

#### 2. Obtener categorías con al menos un producto activo
**Ubicación**: `app/(shop)/catalogo/page.tsx` (para renderizar filtros)
```
SELECT DISTINCT categories.id, categories.name, categories.slug, COUNT(products.id) as product_count
FROM categories
LEFT JOIN products ON categories.id = products.category_id AND products.is_active = true
GROUP BY categories.id, categories.name, categories.slug
HAVING COUNT(products.id) > 0
ORDER BY categories.name ASC
```

#### 3. Obtener producto activo por slug
**Ubicación**: `app/(shop)/producto/[slug]/page.tsx`
```
SELECT products.*, categories.name as category_name, categories.slug as category_slug
FROM products
JOIN categories ON products.category_id = categories.id
WHERE products.slug = $1 AND products.is_active = true
LIMIT 1
```
**Manejo**: Si el resultado es `null`, invocar `notFound()` de Next.js.

#### 4. Static Generation (opcional, para SEO)
**Ubicación**: `app/(shop)/producto/[slug]/page.tsx`
```
generateStaticParams() — retorna array de { slug } de todos los productos activos
generateMetadata() — crea meta tags dinámicos con nombre y descripción del producto
```

---

## Páginas a Implementar

### 1. `/catalogo` — `app/(shop)/catalogo/page.tsx`

**Props**:
- `searchParams`: { `categoria?: string` }

**Responsabilidades**:
1. Fetch de categorías disponibles (con count de productos)
2. Fetch de productos activos con filtro opcional por categoría
3. Renderizar filtros de categoría como botones/tabs (estado activo si matchea query param)
4. Renderizar grid de tarjetas de producto usando `ProductCard`
5. Renderizar estado vacío si no hay productos

**Estado vacío**:
```
"No hay productos disponibles en este momento"
+ botón/enlace para volver a home o "Ver todas las categorías"
```

**Layout grid**: TBD en componentes (sugerencia: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

**Server Component**: Sí (data fetching)

---

### 2. `/producto/[slug]` — `app/(shop)/producto/[slug]/page.tsx`

**Props**:
- `params`: { `slug: string` }

**Responsabilidades**:
1. Fetch de producto por slug (con error 404 si no existe o está inactivo)
2. Renderizar galería de imágenes usando `ProductGallery`
3. Renderizar información del producto: nombre, categoría, descripción completa, precio
4. Renderizar breadcrumb/enlace de retorno a catálogo
5. (Deferred MVP 2) Botón de compra/agregar al carrito

**Campos a mostrar**:
- **Imagen principal** (en galería): `images[0]` o placeholder si array vacío
- **Nombre**: `name`
- **Categoría**: `category.name` (enlace a `/catalogo?categoria=[slug]`)
- **Descripción**: `description` (permitir HTML o markdown si procede)
- **Precio**: mostrar `price` formateado en moneda o "Consultar precio" si null
- **Información de creación**: `created_at` (formato: "Publicado el dd/mm/yyyy")

**Server Component**: Sí (data fetching)

**Metadata**: `generateMetadata()` para OG tags y Open Graph

---

## Componentes a Crear

### 1. `components/shop/ProductCard.tsx`

**Props**:
```ts
interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  image: string; // URL de la primera imagen (images[0])
  price: number | null;
  categoryName: string;
  categorySlug: string;
}
```

**Render**:
- Contenedor tarjeta con hover effect
- Imagen con `next/image` (aspect ratio: 1:1, object-fit: cover)
- Nombre del producto
- Badge de categoría (pequeño, con background color sutilizado)
- Precio: formateado a 2 decimales con símbolo de moneda (o "Consultar precio")
- Enlace a `/producto/[slug]`

**Estilo**:
- shadcn/ui components (Card, Badge)
- Tailwind CSS v4
- Responsive: full width en mobile, width fija en desktop

---

### 2. `components/shop/ProductGallery.tsx`

**Props**:
```ts
interface ProductGalleryProps {
  images: string[]; // array de URLs
  productName: string;
  mainImage?: string; // imagen actual (state local)
}
```

**Comportamiento**:
- Mostrar imagen principal grande
- Miniaturas debajo o a un lado (responsive)
- Click en miniatura cambia imagen principal
- Si `images` está vacío o null, mostrar placeholder
- Soporte para navegación con teclado (arrow keys) — opcional
- Lazy loading de imágenes

**Estilo**:
- shadcn/ui components (si existen, sino Tailwind puro)
- Tailwind CSS v4
- Responsive: galería vertical en mobile, horizontal en desktop

---

## Estructura de Archivos a Crear

```
app/
  (shop)/
    catalogo/
      page.tsx                    (NEW - Server Component)
    producto/
      [slug]/
        page.tsx                  (NEW - Server Component)
components/
  shop/
    ProductCard.tsx               (NEW - Client/Server)
    ProductGallery.tsx            (NEW - Client Component)
lib/
  supabase/
    server.ts                     (EXISTS - usar createClient())
```

---

## Tasking & Sprints

### Sprint 1: Setup & Queries
- [ ] Validar estructura de tablas en Supabase
- [ ] Crear funciones de query en archivo utilitario `lib/supabase/queries.ts`
  - [ ] `fetchCategories()` — retorna categorías con count
  - [ ] `fetchProducts(categorySlug?)` — retorna productos activos
  - [ ] `fetchProductBySlug(slug)` — retorna producto único
- [ ] Crear tipos TypeScript para Product y Category en `lib/types.ts` o `.../types/product.ts`

### Sprint 2: Components
- [ ] Crear `components/shop/ProductCard.tsx`
- [ ] Crear `components/shop/ProductGallery.tsx`
- [ ] Tests unitarios para componentes (85% coverage mínimo)

### Sprint 3: Pages
- [ ] Implementar `app/(shop)/catalogo/page.tsx`
  - [ ] Fetch categorías y productos
  - [ ] Renderizar filtros
  - [ ] Renderizar grid de tarjetas
  - [ ] Estado vacío
- [ ] Implementar `app/(shop)/producto/[slug]/page.tsx`
  - [ ] Fetch producto por slug
  - [ ] Manejo de 404
  - [ ] Renderizar detalles y galería
  - [ ] `generateMetadata()` para SEO
  - [ ] `generateStaticParams()` si aplica
- [ ] Tests e2e: validar ambas páginas

### Sprint 4: Testing & Polish
- [ ] Tests de integración (catalogo listing, filtrado, producto detail)
- [ ] Verificar cobertura ≥ 85%
- [ ] Testing manual: navegación, filtros, 404, estado vacío
- [ ] Performance: Lighthouse > 80

---

## Consideraciones de Implementación

### Performance
- Cachés en Supabase queries: usar `cache: 'force-cache'` en Server Components si los datos cambian con poca frecuencia
- Image optimization: Next.js `Image` component con sizes responsive
- Lazy loading de imágenes en galería

### Accesibilidad
- Galería: ARIA labels, navegación con keyboard
- Filtros: botones accesibles, estado visual claro de selección
- Imágenes: alt text obligatorio

### SEO
- `generateMetadata()` en detail page con OG tags
- Structured data (JSON-LD) para Product schema — opcional para MVP 1
- Meta description en listado

### Estado Vacío
- Mensaje claro: "No hay productos disponibles"
- Opción de retorno: botón a `/catalogo` sin filtros o a home

### Validación de Datos
- Si producto tiene `images` vacío o null: renderizar placeholder claro
- Si precio es null: mostrar "Consultar precio"
- Si descripción es vacía: permitir, no renderizar sección

---

## Deferred (MVP 2 o posterior)

- [ ] Carrito de compra / Botón "Agregar al carrito"
- [ ] Búsqueda por texto de productos
- [ ] Visualización de stock en listado y detalle
- [ ] Opciones de ordenamiento (precio, nombre, popularidad)
- [ ] Paginación del catálogo
- [ ] Reseñas y comentarios
- [ ] Wishlist / Favoritos
- [ ] Comparación de productos
- [ ] Filtros avanzados (rango de precio, etc.)

---

## Notas

- Las URLs son canónicas: `/catalogo` y `/producto/[slug]`
- No se requieren API routes para lecturas públicas
- Toda la data fetching sucede en Server Components
- El filtrado por categoría usa query param estándar `?categoria=[slug]`
