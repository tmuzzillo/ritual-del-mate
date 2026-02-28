# Feature Specification: Home / Landing Page

**Created**: 2026-02-28

## Contexto

La home es la primera pantalla que ve un visitante que llega desde Instagram u otro canal externo. Debe comunicar la identidad de marca en segundos, orientar al visitante hacia el catálogo y generar confianza. No hay checkout en MVP 1, por lo que el objetivo es **inspirar y dirigir al catálogo**.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Primera impresión de marca (P1)

El visitante llega desde Instagram y aterriza en la home. En menos de 5 segundos entiende qué vende el negocio y tiene un camino claro para seguir explorando.

**Why this priority**: Es la pantalla de entrada principal. Si no comunica en el primer golpe de vista, el visitante rebota.

**Independent Test**: Acceder a `/` debe retornar HTTP 200 con el hero visible, el tagline y el botón CTA.

**Acceptance Scenarios**:

1. **Scenario**: Hero visible en mobile y desktop
   - **Given** el visitante accede a `/`
   - **When** la página carga
   - **Then** se muestra el logo, el tagline "Mates y accesorios seleccionados con intención. Transforma tu momento matero en ritual." y un botón "Ver catálogo" que lleva a `/catalogo`

2. **Scenario**: CTA funciona correctamente
   - **Given** el visitante está en la home
   - **When** hace click en "Ver catálogo"
   - **Then** navega a `/catalogo`

---

### User Story 2 - Descubrir productos destacados (P1)

El visitante ve una selección curada de productos desde la home y puede hacer click para ver su detalle.

**Why this priority**: Los productos destacados son el escaparate principal. Permiten que el visitante tenga una probada del catálogo sin tener que navegar.

**Independent Test**: Con al menos un producto con `featured=true` e `is_active=true`, la sección debe renderizar al menos una card.

**Acceptance Scenarios**:

1. **Scenario**: Se muestran productos destacados
   - **Given** existen productos con `featured=true` e `is_active=true`
   - **When** el visitante carga la home
   - **Then** se muestra una grilla de hasta 6 productos con nombre, imagen principal y precio

2. **Scenario**: Click en producto destacado
   - **Given** un producto destacado está visible en la home
   - **When** el visitante hace click en la card
   - **Then** navega a `/producto/[slug]`

3. **Scenario**: Sin productos destacados
   - **Given** no hay productos con `featured=true`
   - **When** el visitante carga la home
   - **Then** la sección de productos destacados no se renderiza (oculta completamente, no muestra estado vacío)

---

### User Story 3 - Descubrir sets y combos (P1)

El visitante ve los sets disponibles desde la home, entendiendo que puede comprar combinaciones curadas además de productos individuales.

**Why this priority**: Los sets son un diferenciador del negocio. Tenerlos en home aumenta el ticket promedio potencial en MVP 2.

**Independent Test**: Con al menos un set con `featured=true` e `is_active=true`, la sección debe renderizar.

**Acceptance Scenarios**:

1. **Scenario**: Se muestran sets destacados
   - **Given** existen sets con `featured=true` e `is_active=true`
   - **When** el visitante carga la home
   - **Then** se muestra una sección de sets con nombre, imagen y precio

2. **Scenario**: Sin sets destacados
   - **Given** no hay sets con `featured=true`
   - **When** el visitante carga la home
   - **Then** la sección de sets no se renderiza

---

### User Story 4 - Explorar colecciones (P2)

El visitante descubre las colecciones curadas y puede navegar a una colección específica.

**Why this priority**: Las colecciones ofrecen navegación editorial. Son P2 porque dependen de que existan colecciones activas cargadas en el sistema.

**Independent Test**: Con al menos una colección con `is_active=true`, la sección debe renderizar.

**Acceptance Scenarios**:

1. **Scenario**: Se muestran colecciones activas
   - **Given** existen colecciones con `is_active=true`
   - **When** el visitante carga la home
   - **Then** se muestran las colecciones activas con nombre, imagen y descripción

2. **Scenario**: Sin colecciones activas
   - **Given** no hay colecciones con `is_active=true`
   - **When** el visitante carga la home
   - **Then** la sección de colecciones no se renderiza

---

### User Story 5 - Conocer la marca (P2)

El visitante lee una breve presentación del negocio y puede acceder al Instagram de la marca.

**Why this priority**: Genera confianza en marcas artesanales. Las personas compran a personas. Puede completarse con contenido real en una segunda iteración.

**Independent Test**: La sección "Sobre Ritual del Mate" debe renderizar con contenido placeholder.

**Acceptance Scenarios**:

1. **Scenario**: Sección "Sobre nosotras" visible
   - **Given** el visitante llega a la home
   - **When** hace scroll hacia abajo
   - **Then** ve una sección con texto institucional (placeholder en MVP) y un botón/link a Instagram

---

### Edge Cases

- Si no hay productos NI sets destacados, la home no colapsa: muestra hero + colecciones (si existen) + sobre nosotras + footer.
- El hero funciona sin imagen de fondo (usa gradiente de marca como fallback).
- Productos activos que pierden el estado `featured` desaparecen de la home en el próximo build/reload.
- Imágenes de productos sin cargar deben tener fallback visual (placeholder con color de marca).

---

## Out of Scope

- Carrito de compras / checkout (MVP 2)
- Búsqueda desde la home
- Instagram feed embed en tiempo real (requiere API de Instagram, deferido)
- Edición del contenido de la home desde el admin (tagline, textos de "Sobre nosotras") — en MVP 1 el contenido es estático en código; se hará editable en una iteración futura
- Animaciones de entrada / scroll animations complejas
- Sección de reseñas o testimonios
- Pop-up de suscripción a newsletter
- Chat / WhatsApp flotante

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La home (`/`) debe ser accesible públicamente sin autenticación
- **FR-002**: El hero debe incluir: logo, tagline, botón CTA "Ver catálogo" → `/catalogo`
- **FR-003**: La sección de productos destacados debe mostrar solo productos con `featured=true` AND `is_active=true`, máximo 6
- **FR-004**: La sección de sets destacados debe mostrar solo sets con `featured=true` AND `is_active=true`, máximo 4
- **FR-005**: La sección de colecciones debe mostrar solo colecciones con `is_active=true`, máximo 4
- **FR-006**: Las secciones de productos, sets y colecciones son condicionales: si no hay items que mostrar, la sección no renderiza
- **FR-007**: El footer debe incluir: copyright, link a Instagram (configurable), links de navegación (Catálogo, Sets, Colecciones)
- **FR-008**: La home debe ser completamente responsive (mobile-first)
- **FR-009**: El admin puede marcar un producto como destacado desde el formulario de edición de producto (toggle "Destacado en home")
- **FR-010**: El admin puede marcar un set como destacado desde el formulario de edición de set (toggle "Destacado en home")
- **FR-011**: La sección "Sobre nosotras" muestra contenido placeholder en MVP 1 con indicación clara de que será completado

### Key Entities

- **FeaturedProduct**: Producto con `featured=true` AND `is_active=true`. Muestra: nombre, imagen principal, precio (si tiene), slug para link.
- **FeaturedSet**: Set con `featured=true` AND `is_active=true`. Muestra: nombre, imagen principal, precio, slug para link.
- **ActiveCollection**: Colección con `is_active=true`. Muestra: nombre, descripción, imagen principal, slug para link.

### Cambios de base de datos requeridos

- Agregar campo `featured BOOLEAN NOT NULL DEFAULT false` a tabla `products`
- Agregar campo `featured BOOLEAN NOT NULL DEFAULT false` a tabla `sets`
- Migración: `002_add_featured_fields.sql`

### Cambios en admin requeridos

- Agregar toggle "Destacado en home" al formulario de producto (ya existe `ProductFormDialog`)
- Agregar toggle "Destacado en home" al formulario de set (ya existe `SetFormDialog`)

---

## Layout de Secciones

```
┌──────────────────────────────────────┐
│  NAVBAR (logo + links)               │
├──────────────────────────────────────┤
│  HERO                                │
│  Tagline + CTA "Ver catálogo"        │
├──────────────────────────────────────┤
│  PRODUCTOS DESTACADOS (si hay)       │
│  Grid 2 col mobile / 3 col desktop   │
├──────────────────────────────────────┤
│  SETS Y COMBOS (si hay)              │
│  Grid 1 col mobile / 2 col desktop   │
├──────────────────────────────────────┤
│  COLECCIONES (si hay)                │
│  Grid 1 col mobile / 2 col desktop   │
├──────────────────────────────────────┤
│  SOBRE RITUAL DEL MATE               │
│  Texto + link Instagram              │
├──────────────────────────────────────┤
│  FOOTER                              │
│  Nav + Instagram + copyright         │
└──────────────────────────────────────┘
```

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: La home carga en menos de 2 segundos en mobile con conexión 4G
- **SC-002**: El toggle "Destacado en home" en el admin refleja el cambio en la home en el próximo reload (sin pasos intermedios)
- **SC-003**: La home no tiene errores de consola en ninguna combinación de secciones visibles/ocultas
- **SC-004**: 100% responsive: sin scroll horizontal en ningún breakpoint (320px → 1440px)
- **SC-005**: Las secciones condicionales no generan espacios en blanco vacíos cuando no tienen contenido
- **SC-006**: El admin puede marcar/desmarcar un producto como destacado en menos de 3 clicks
