# Feature Specification: Catálogo Público

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navegar el catálogo de productos (P1)
El visitante anónimo accede a la página de catálogo y visualiza la lista completa de productos activos con información esencial para cada uno.

**Why this priority**: Es la funcionalidad core del MVP. Sin la capacidad de ver productos, el usuario no puede completar el viaje de compra ni interactuar con el negocio.

**Independent Test**: Acceder a `/catalogo` debe retornar HTTP 200 con al menos un producto visible si existen productos activos en la base de datos.

**Acceptance Scenarios**:
1. **Scenario**: Visualizar lista de productos activos
   - **Given** existen productos con `is_active=true` en la base de datos
   - **When** el visitante navega a `/catalogo`
   - **Then** se muestran todos los productos activos con nombre, imagen principal, precio y categoría

2. **Scenario**: Catálogo vacío
   - **Given** no existen productos activos en la base de datos
   - **When** el visitante navega a `/catalogo`
   - **Then** se muestra un mensaje indicando que el catálogo está vacío

---

### User Story 2 - Ver detalle de un producto (P2)
El visitante accede a la página de detalle de un producto y visualiza toda la información disponible incluyendo descripción completa, todas las imágenes, precio y categoría.

**Why this priority**: Necesario para que el usuario pueda tomar decisiones de compra informadas antes del MVP de checkout.

**Independent Test**: Acceder a `/producto/[slug]` de un producto activo debe retornar HTTP 200 con todos los datos del producto.

**Acceptance Scenarios**:
1. **Scenario**: Visualizar detalle completo de un producto
   - **Given** existe un producto activo con slug válido
   - **When** el visitante navega a `/producto/[slug]`
   - **Then** se muestra nombre, descripción completa, todas las imágenes, precio, categoría y datos de creación

2. **Scenario**: Producto con múltiples imágenes
   - **Given** un producto tiene 3 o más imágenes asociadas
   - **When** el visitante visualiza el detalle del producto
   - **Then** se muestran todas las imágenes en una galería navegable

---

### User Story 3 - Filtrar catálogo por categoría (P3)
El visitante puede filtrar la lista de productos por categoría para encontrar rápidamente productos de su interés.

**Why this priority**: Mejora la experiencia de navegación cuando el catálogo crece, reduce fricción para encontrar lo que busca.

**Independent Test**: Acceder a `/catalogo?categoria=[slug-categoria]` debe retornar solo productos activos de esa categoría.

**Acceptance Scenarios**:
1. **Scenario**: Filtrar productos por categoría específica
   - **Given** existen productos activos en múltiples categorías
   - **When** el visitante selecciona una categoría
   - **Then** se muestran solo los productos activos de esa categoría

2. **Scenario**: Ver todas las categorías disponibles
   - **Given** existen categorías con al menos un producto activo
   - **When** el visitante visualiza el catálogo
   - **Then** se muestran los filtros de categoría disponibles

---

### User Story 4 - Acceder a producto inactivo o inexistente (P4)
El visitante intenta acceder a un producto que no existe o que fue desactivado, recibiendo una respuesta clara.

**Why this priority**: Fundamental para la integridad de la aplicación y experiencia del usuario. Evita errores 500 y proporciona orientación clara.

**Independent Test**: Acceder a `/producto/[slug-inexistente]` debe retornar HTTP 404.

**Acceptance Scenarios**:
1. **Scenario**: Acceder a producto que no existe
   - **Given** el slug no corresponde a ningún producto en la base de datos
   - **When** el visitante navega a `/producto/[slug-inexistente]`
   - **Then** se muestra página 404 con opción de volver al catálogo

2. **Scenario**: Acceder a producto desactivado
   - **Given** existe un producto con `is_active=false`
   - **When** el visitante intenta acceder a `/producto/[slug-inactivo]`
   - **Then** se muestra página 404 (como si no existiera)

---

### Edge Cases
- Catálogo con cero productos activos — mostrar estado vacío con llamada a acción
- Producto sin imágenes — usar imagen placeholder o campo vacío claramente comunicado
- Producto sin descripción — permitir descripciones vacías, mostrar solo información disponible
- Productos inactivos nunca deben aparecer en listados ni ser accesibles vía URL
- Categoría sin productos activos — no mostrar en filtros de categoría

## Out of Scope
- Funcionalidad de compra / agregar al carrito (MVP 2)
- Búsqueda por texto de productos
- Visualización de stock disponible en listado o detalle (MVP 2)
- Opciones de ordenamiento más allá del orden por defecto
- Paginación del catálogo (no definida para MVP 1)
- Reseñas o comentarios de usuarios
- Wishlist o favoritos
- Comparación de productos

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El catálogo debe mostrar solo productos con `is_active=true`
- **FR-002**: Cada producto en listado debe mostrar: nombre, imagen principal (primera del array `images`), precio y categoría
- **FR-003**: La página de detalle de producto debe mostrar: nombre, descripción completa, todas las imágenes, precio, categoría e información de creación
- **FR-004**: Debe existir filtrado por categoría que respete el estado `is_active` de los productos
- **FR-005**: Los productos inactivos deben retornar HTTP 404 cuando se accede a su URL
- **FR-006**: El estado vacío del catálogo debe ser visible cuando no hay productos activos
- **FR-007**: Las imágenes del producto deben ser accesibles y cargarse correctamente desde el array `images`
- **FR-008**: La URL debe ser canónica: `/catalogo` para listado y `/producto/[slug]` para detalle

### Key Entities
- **Product**: Entidad core que contiene id, nombre, slug, descripción, precio, stock, imágenes, categoría, estado activo y fecha de creación
- **Category**: Entidad relacionada que contiene id, nombre, slug y fecha de creación. Se embebe en Product mediante relación `category_id` y campo `category`
- **ProductImage**: Array de strings dentro de Product que almacena URLs de imágenes

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 100% de productos activos visibles en `/catalogo` sin errores de carga
- **SC-002**: Página de detalle `/producto/[slug]` carga en menos de 2 segundos para cualquier producto activo
- **SC-003**: Filtrado por categoría retorna solo productos activos y sin duplicados
- **SC-004**: Acceso a productos inactivos o inexistentes retorna HTTP 404 sin excepciones en logs
- **SC-005**: El código del feature cumple con mínimo 85% de cobertura en tests
- **SC-006**: No hay productos activos con `images` vacío o `null` en producción (validación en data)
