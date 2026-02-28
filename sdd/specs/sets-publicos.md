# Feature Specification: Sets Públicos

**Created**: 2026-02-28

## User Scenarios & Testing *(obligatorio)*

### User Story 1 - Explorar catálogo de sets (Priority: P1)
El visitante navega la página de listado de sets disponibles para explorar las ofertas disponibles en el catálogo.

**Why this priority**: Es el entry point principal para que los visitantes anónimos conozcan los sets disponibles. Sin esta funcionalidad, no hay forma de descubrir productos.

**Independent Test**: Verificar que la página de listado carga correctamente y muestra sets activos.

**Acceptance Scenarios**:
1. **Scenario**: Visualizar sets disponibles en el listado
   - **Given** el visitante accede a `/sets`
   - **When** la página carga
   - **Then** se muestran todos los sets con `is_active = true` con nombre, imagen principal y precio

2. **Scenario**: Listado vacío
   - **Given** no hay sets activos en la base de datos
   - **When** el visitante accede a `/sets`
   - **Then** se muestra un mensaje indicando que no hay sets disponibles

---

### User Story 2 - Ver detalle de un set (Priority: P2)
El visitante selecciona un set del listado para ver información completa, incluyendo descripción, todas las imágenes, precio y productos incluidos.

**Why this priority**: Permite que el visitante tome una decisión de compra informada (futuro MVP). Es crítico conocer qué productos contiene el set y sus cantidades.

**Independent Test**: Verificar que los detalles del set se cargan correctamente desde la URL.

**Acceptance Scenarios**:
1. **Scenario**: Ver información completa de un set
   - **Given** el visitante accede a `/set/[slug]` donde slug corresponde a un set activo
   - **When** la página carga
   - **Then** se muestra nombre, descripción, precio, todas las imágenes, y la lista de productos incluidos con cantidades

2. **Scenario**: Set sin imágenes
   - **Given** un set tiene `images = []`
   - **When** el visitante accede al detalle del set
   - **Then** se muestra un placeholder o imagen por defecto en lugar de fallar

3. **Scenario**: Set sin items incluidos
   - **Given** un set tiene `set_items = []` o undefined
   - **When** el visitante accede al detalle del set
   - **Then** se muestra claramente que el set no contiene productos (sin romper la UI)

---

### User Story 3 - Manejo de sets inexistentes o inactivos (Priority: P3)
El visitante intenta acceder a un set que no existe o está inactivo y recibe una indicación clara de que no está disponible.

**Why this priority**: Garantiza una experiencia correcta ante casos excepcionales. Evita confusiones o experiencias degradadas.

**Independent Test**: Verificar que URLs de sets inactivos o inexistentes retornan 404 o estado no encontrado.

**Acceptance Scenarios**:
1. **Scenario**: Acceder a un set inactivo
   - **Given** existe un set con `is_active = false`
   - **When** el visitante intenta acceder a `/set/[slug]`
   - **Then** se muestra página de error 404 (no encontrado)

2. **Scenario**: Acceder a un set inexistente
   - **Given** el slug solicitado no corresponde a ningún set
   - **When** el visitante accede a `/set/[slug]`
   - **Then** se muestra página de error 404

---

### Edge Cases
- Sets con cero items en la lista (set_items vacío)
- Sets sin imágenes (array images vacío)
- Listado completamente vacío (sin sets activos)
- Sets con productos dados de baja (product deleted pero sigue en set_items)
- Slugs duplicados o especiales (caracteres URL)

## Out of Scope
- Filtrado de sets por categoría (puede agregarse en iteración futura dentro del MVP 1)
- Agregar sets al carrito (MVP 2)
- Comprar sets (MVP 2)
- Personalizar contenido del set (los visitantes no pueden elegir productos)
- Stock por set (MVP 2)
- Recomendaciones o filtros en listado
- Búsqueda de sets
- Comentarios o reseñas

## Requirements *(obligatorio)*

### Functional Requirements
- **FR-001**: El listado de sets (`/sets`) debe mostrar únicamente sets con `is_active = true`
- **FR-002**: El listado debe mostrar para cada set: nombre, imagen principal (primera de `images[]`), y precio
- **FR-003**: La página de detalle (`/set/[slug]`) debe cargar el set, sus items relacionados y los productos de cada item
- **FR-004**: La página de detalle debe mostrar: nombre, descripción, precio, todas las imágenes, y lista de productos con cantidades
- **FR-005**: Sets inactivos no deben ser accesibles por URL ni aparecer en listados
- **FR-006**: URLs de sets inexistentes o inactivos deben retornar estado 404
- **FR-007**: La página debe manejar gracefully casos sin imágenes o sin items (sin quebrar la UI)

### Key Entities
- **MateSet**: Representa un conjunto curado de productos. Campos clave: `id`, `name`, `slug`, `description`, `price`, `images[]`, `category_id`, `category` (relación), `is_active`, `set_items[]`, `created_at`
- **SetItem**: Representa un producto dentro de un set. Referencia el **mismo `product_id`** del catálogo — no es una copia. Campos clave: `id`, `set_id`, `product_id`, `quantity`, `product` (relación)
- **Product**: Producto individual que puede estar en uno o varios sets. Campos clave: `id`, `name`, `price` (nullable), `images[]`, `is_active`

## Success Criteria *(obligatorio)*

### Measurable Outcomes
- **SC-001**: 100% de sets activos se muestran en el listado `/sets`
- **SC-002**: La página de detalle carga correctamente para cualquier set activo válido
- **SC-003**: URLs de sets inactivos/inexistentes retornan 404 (0% de acceso a sets inactivos)
- **SC-004**: La página no falla cuando un set carece de imágenes o items
- **SC-005**: Cobertura de código introducido >= 85%
