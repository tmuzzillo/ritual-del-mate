# Spec Técnico: Rediseño Home — Ritual del Mate

**Feature**: `rediseno-home`
**Fecha**: 2026-04-02

---

## Stack involucrado

- Next.js 16 App Router (Server + Client Components)
- Tailwind CSS v4 (tokens via CSS variables en `globals.css`)
- Framer Motion (nueva dependencia)
- Supabase (Postgres + Storage)
- TypeScript

---

## Dependencias nuevas

```bash
npm install framer-motion
```

Framer Motion v11+ soporta React 19 y Next.js App Router. Se usa exclusivamente en Client Components (`"use client"`).

---

## Migración de base de datos

### `supabase/migrations/006_collections_tagline.sql`

```sql
ALTER TABLE collections ADD COLUMN tagline TEXT;
```

Ejecutar manualmente en Supabase SQL Editor después de correr la migración:

```sql
UPDATE collections SET tagline = 'Tu forma de bajar el ritmo'  WHERE slug = 'calma';
UPDATE collections SET tagline = 'Tu manera de plantarte'      WHERE slug = 'fuerza';
UPDATE collections SET tagline = 'Tu identidad visible'        WHERE slug = 'expresion';
```

---

## Cambios de tipos

### `types/index.ts`

```typescript
export interface Collection {
  // ...existente
  tagline?: string | null;  // NUEVO
}
```

---

## Design system global

### `app/globals.css`

Reemplazar los tokens `--color-brand-*` existentes:

```css
@theme inline {
  --color-brand-cream:  #EFEADF;   /* era #EAE0D5 */
  --color-brand-dark:   #38331C;   /* reemplaza brand-charcoal (#1E1A12) */
  --color-brand-olive:  #7B7648;   /* era #536430 */
  --color-brand-brown:  #6F563B;   /* NUEVO */
  --color-brand-golden: #D5B477;   /* NUEVO */
  --color-brand-orange: #BF7438;   /* reemplaza brand-terracotta (#C4562A) */
  --color-brand-sand:   #D4C5B2;   /* sin cambio */
  /* Eliminar: brand-terracotta, brand-terracotta-hover, brand-warm-gray, brand-olive-light */
}
```

**Nota de retrocompatibilidad**: El admin usa `brand-charcoal`, `brand-terracotta`, `brand-warm-gray`. Al renombrar, hay que actualizar las referencias en todos los componentes admin también. Alternativa más segura: mantener los nombres anteriores como alias que apuntan a los nuevos valores, y migrar gradualmente.

**Decisión recomendada**: Mantener `brand-charcoal` → `#38331C` (nuevo valor) y `brand-terracotta` → `#BF7438` (nuevo valor), sin renombrar. Agregar los tokens nuevos (`brand-brown`, `brand-golden`, `brand-dark`). Así el admin no se rompe.

### `app/layout.tsx`

```typescript
// Reemplazar:
import { Nunito } from "next/font/google";
const nunito = Nunito({ ... });

// Por:
import { Montserrat } from "next/font/google";
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
```

Actualizar la clase del `<body>`:
```typescript
<body className={`${montserrat.variable} font-[family-name:var(--font-montserrat)]`}>
```

---

## Logo

Copiar el archivo de referencia a public:
```bash
cp "ux/ux-ui resources/WhatsApp Image 2026-04-02 at 15.42.25 (2).jpeg" public/logo-blob.jpg
```

Usar en navbar:
```tsx
<Image
  src="/logo-blob.jpg"
  alt="Ritual del Mate"
  width={120}
  height={120}
  className="object-contain"
  priority
/>
```

---

## Componentes nuevos

### `components/shop/animated-section.tsx`

Client Component reutilizable. Usa `useInView` de Framer Motion para disparar la animación cuando el elemento entra en viewport.

```typescript
"use client";
interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;        // segundos, default 0
  direction?: "up" | "left" | "right";  // default "up"
}
```

Implementación base:
```typescript
const variants = {
  hidden: { opacity: 0, y: direction === "up" ? 30 : 0, x: ... },
  visible: { opacity: 1, y: 0, x: 0 },
};
// useInView con once: true, amount: 0.2
// motion.div con variants, transition: { duration: 0.5, delay }
```

### `components/shop/collection-card-home.tsx`

Client Component (para hover effects). Card grande con:
- Imagen de fondo (`object-cover`)
- Overlay degradado oscuro en la parte inferior
- Nombre de colección (H3, Montserrat 700)
- Tagline (Montserrat 400, más pequeño)
- CTA "Ver sets →" (link con color brand-orange)

```typescript
interface CollectionCardHomeProps {
  collection: Collection;  // incluye tagline
}
```

Aspect ratio: `aspect-[3/4]` en mobile, `aspect-[4/3]` en desktop (via responsive Tailwind).

### `components/shop/sets-carousel.tsx`

Client Component. Carrusel horizontal con Framer Motion drag:

```typescript
"use client";
interface SetsCarouselProps {
  sets: MateSet[];
}
```

Implementación:
```typescript
const carouselRef = useRef<HTMLDivElement>(null);
// motion.div con drag="x", dragConstraints={carouselRef}
// Cada SetCard dentro con flex-shrink-0 y ancho fijo
```

Usa el componente `SetCard` existente en `components/shop/set-card.tsx`.

---

## Componentes modificados

### `components/shop/navbar.tsx`

- Reemplazar `<span>Ritual del Mate</span>` por `<Image src="/logo-blob.jpg" ... />`
- Actualizar `bg-brand-cream` (mantiene) y colores de hover/activo a nueva paleta
- Altura del navbar puede requerir ajuste si el logo es más alto que el texto actual

### `components/shop/footer.tsx`

- `bg-brand-charcoal` → `bg-brand-charcoal` (mismo nombre, nuevo valor `#38331C`)
- Revisar contraste de textos con nuevo color de fondo

---

## Home page

### `app/(shop)/page.tsx`

Server Component que:

1. Hace 3 queries en paralelo a Supabase:
```typescript
const [collectionsRes, setsRes, productsRes] = await Promise.all([
  supabase.from("collections").select("id, name, slug, description, tagline, images").eq("is_active", true).order("name"),
  supabase.from("sets").select("id, name, slug, price, images").eq("is_active", true).eq("featured", true).limit(6),
  supabase.from("products")
    .select("id, name, slug, price, images, variations:product_variations(id, images, is_default, is_active)")
    .eq("is_active", true).eq("featured", true).limit(4),
]);
```

2. Estructura JSX con las 5 secciones, usando `AnimatedSection` como wrapper de cada una.

3. El hero NO usa `AnimatedSection` — sus animaciones se ejecutan al cargar (no con scroll).

---

## Query de Supabase para la home

Las colecciones necesitan el campo `tagline` en el select:
```typescript
supabase.from("collections").select("id, name, slug, description, tagline, images")
```

El campo `tagline` existe tras correr la migración 006.

---

## Consideraciones de rendimiento

- `priority` en la imagen del logo (navbar, above the fold)
- Las imágenes de colección usan `sizes` apropiado: `(max-width: 768px) 100vw, 33vw`
- `once: true` en `useInView` para no re-animar al hacer scroll hacia arriba
- Las queries se ejecutan en el servidor — no hay loading state en la home

---

## Verificación técnica

```bash
npm run build    # sin errores TypeScript
npm run lint     # sin warnings ESLint
npm run dev      # verificar visual en localhost:3000
```

Checklist:
- [ ] Migración 006 corrida en Supabase
- [ ] taglines actualizados en las 3 colecciones
- [ ] `npm install framer-motion` corrido
- [ ] Logo copiado a `public/logo-blob.jpg`
- [ ] globals.css tokens actualizados
- [ ] layout.tsx usando Montserrat
- [ ] Animaciones visibles al hacer scroll
- [ ] Carrusel draggable en desktop y swipeable en mobile
- [ ] Build exitoso
