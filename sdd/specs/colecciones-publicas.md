# Feature Specification: Colecciones Públicas

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar listado de colecciones (Priority: P1)
El visitante anónimo accede a la página de colecciones y visualiza todas las colecciones activas disponibles en el catálogo.

**Why this priority**: Es la funcionalidad principal que permite a los visitantes descubrir temáticas curadas de productos. Crítica para la navegación del e-commerce en MVP 1.

**Independent Test**: Verificar que `/app/(shop)/colecciones/page.tsx` muestre correctamente todas las colecciones activas con nombre, imagen principal y descripción breve.

**Acceptance Scenarios**:
1. **Scenario**: Visitante accede al listado de colecciones
   - **Given** el visitante está en la página principal del sitio
   - **When** navega a `/colecciones`
   - **Then** visualiza todas las colecciones activas (is_active = true) con nombre, imagen principal y descripción truncada

2. **Scenario**: Listado vacío de colecciones
   - **Given** no hay colecciones activas en el sistema
   - **When** el visitante accede a `/colecciones`
   - **Then** visualiza un mensaje informativo indicando que no hay colecciones disponibles

---

### User Story 2 - Ver detalle de colección (Priority: P2)
El visitante accede a la página de detalle de una colección y visualiza todos los productos y sets que pertenecen a ella.

**Why this priority**: Permite explorar en profundidad una temática específica. Necesaria para completar el flujo de navegación de MVP 1.

**Independent Test**: Verificar que `/app/(shop)/colecciones/[slug]/page.tsx` muestre correctamente todos los productos y sets activos pertenecientes a la colección.

**Acceptance Scenarios**:
1. **Scenario**: Visitante ve colección con productos y sets
   - **Given** existe una colección activa con productos y sets asignados
   - **When** el visitante accede a `/colecciones/[slug]` de esa colección
   - **Then** visualiza nombre de colección, descripción, imagen principal, y lista de todos los productos y sets activos con nombre, imagen principal y precio

2. **Scenario**: Colección con solo productos activos
   - **Given** existe una colección activa con solo productos asignados
   - **When** el visitante accede a `/colecciones/[slug]`
   - **Then** visualiza solo los productos activos de la colección

3. **Scenario**: Colección con todos los items inactivos
   - **Given** existe una colección activa pero todos sus productos y sets están inactivos (is_active = false)
   - **When** el visitante accede a `/colecciones/[slug]`
   - **Then** visualiza la colección con un mensaje indicando que no hay items disponibles en este momento

4. **Scenario**: Colección sin imagen
   - **Given** una colección activa no tiene imagen asignada (images vacío)
   - **When** el visitante accede a `/colecciones/[slug]`
   - **Then** se muestra un placeholder o imagen por defecto

---

### User Story 3 - Manejar colección inexistente o inactiva (Priority: P3)
El visitante intenta acceder a una colección que no existe o está inactiva.

**Why this priority**: Necesario para manejar errores correctamente y mantener la experiencia consistente. Requerido para completar el flujo de MVP 1.

**Independent Test**: Verificar que URLs inválidas retornan 404 y rutas a colecciones inactivas redirigen o muestran 404.

**Acceptance Scenarios**:
1. **Scenario**: Visitante accede a colección inexistente
   - **Given** el visitante intenta acceder a `/colecciones/slug-inexistente`
   - **When** esa colección no existe en el sistema
   - **Then** se visualiza una página 404 con mensaje informativo

2. **Scenario**: Visitante accede a colección inactiva
   - **Given** existe una colección con is_active = false
   - **When** el visitante intenta acceder a `/colecciones/[slug]` de esa colección
   - **Then** se visualiza una página 404 (las colecciones inactivas no son accesibles públicamente)

---

### Edge Cases
- Colección sin ningún producto o set asignado: mostrar página con mensaje "No hay items en esta colección"
- Colección con imagen pero sin descripción: mostrar imagen y nombre, descripción en blanco
- Producto o set que pertenece a múltiples colecciones: debe aparecer en cada una (validar que no se duplica en la misma colección)
- Colección con descripción muy larga: truncar visualmente en listado, mostrar completa en detalle
- Slugs duplicados o caracteres especiales: asegurar que el slug es único y URL-safe

---

## Out of Scope
- Filtrado dentro de una colección por categoría o rango de precio
- Agregar items al carrito desde la página de colección (MVP 2)
- Búsqueda dentro de colecciones
- Edición o administración de colecciones por parte de usuario anónimo
- Reorden manual de colecciones en el listado (orden por fecha de creación)

---

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El sistema debe mostrar todas las colecciones activas (is_active = true) en la página `/colecciones` con nombre, imagen principal y descripción
- **FR-002**: El sistema debe permitir acceder al detalle de una colección activa mediante `/colecciones/[slug]` mostrando todos los productos y sets activos pertenecientes a ella
- **FR-003**: El sistema debe mostrar un mensaje informativo cuando una colección no tiene productos o sets disponibles
- **FR-004**: El sistema debe retornar 404 cuando se intenta acceder a una colección inexistente
- **FR-005**: El sistema debe retornar 404 cuando se intenta acceder a una colección inactiva
- **FR-006**: El sistema debe soportar que un producto o set pertenezca a múltiples colecciones simultáneamente
- **FR-007**: Los productos y sets mostrados en una colección deben ser solo aquellos con is_active = true

### Key Entities
- **Collection**: Agrupación manual de productos y/o sets con características o temática común
  - `id`: identificador único
  - `name`: nombre de la colección (ej. "Colección Otoño")
  - `slug`: identificador URL-safe único
  - `description`: descripción extendida (opcional)
  - `images`: array de URLs de imágenes
  - `is_active`: booleano que indica si la colección es visible públicamente
  - `created_at`: timestamp de creación
  - `products`: array de productos pertenecientes a la colección (relación muchos-a-muchos)
  - `sets`: array de sets pertenecientes a la colección (relación muchos-a-muchos)

- **Product** (relación existente): Producto individual con `id`, `name`, `slug`, `description`, `price`, `images`, `category_id`, `is_active`
- **MateSet** (relación existente): Set de productos con `id`, `name`, `slug`, `description`, `price`, `images`, `category_id`, `is_active`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: El listado de colecciones en `/colecciones` carga en menos de 1 segundo y muestra correctamente todas las colecciones activas
- **SC-002**: La página de detalle de colección `/colecciones/[slug]` muestra todos los productos y sets activos sin duplicados
- **SC-003**: Las páginas retornan 404 apropiadamente para colecciones inexistentes o inactivas
- **SC-004**: No se muestran productos o sets inactivos en ninguna colección
- **SC-005**: Cobertura de código introducido es mínimo 85% (según estándares del proyecto)
- **SC-006**: Las rutas y componentes son retrocompatibles con la estructura existente de MVP 1
