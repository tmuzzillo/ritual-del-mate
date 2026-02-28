# Feature Specification: Gestión de Sets (Admin)

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un nuevo set (Priority: P1)
El admin puede crear un nuevo set (combo) especificando nombre, descripción, precio, imágenes y productos que lo integran con sus cantidades.

**Why this priority**: Es la funcionalidad core que habilita el modelo de negocio de bundles. Sin capacidad de crear sets, el admin no puede ofrecer combos a los clientes.

**Independent Test**: Admin puede completar el formulario de creación con todos los campos obligatorios y el set se persiste en la base de datos con estado activo.

**Acceptance Scenarios**:
1. **Scenario**: Crear set con todos los campos requeridos
   - **Given** el admin está en la página `/admin/sets`
   - **When** completa el formulario (nombre, descripción, precio) y agrega al menos un producto con cantidad
   - **Then** el set se crea exitosamente, se genera el slug automáticamente, y aparece en la lista de sets

2. **Scenario**: Slug se genera automáticamente
   - **Given** el admin ingresa el nombre "Mi Set Premium"
   - **When** completa el formulario y guarda
   - **Then** el slug se genera como "mi-set-premium" (o similar, con formato URL-safe)

3. **Scenario**: Admin sube imágenes para el set
   - **Given** el formulario de creación está abierto
   - **When** el admin sube una o más imágenes
   - **Then** las imágenes se guardan y se asocian al set

4. **Scenario**: Admin crea set sin productos (draft)
   - **Given** el admin completa nombre, descripción y precio
   - **When** guarda sin agregar productos
   - **Then** el set se crea pero permanece inactivo (estado draft)

---

### User Story 2 - Editar un set existente (Priority: P2)
El admin puede modificar todos los campos de un set existente: nombre, descripción, precio, imágenes, productos y cantidades.

**Why this priority**: Essential para corregir errores, ajustar precios y actualizar el contenido de sets ya creados sin necesidad de eliminar y recrear.

**Independent Test**: Admin puede abrir un set existente, cambiar uno o más campos, guardar los cambios, y verificar que se actualizaron correctamente.

**Acceptance Scenarios**:
1. **Scenario**: Editar datos básicos del set
   - **Given** el admin abre un set existente
   - **When** modifica nombre, descripción o precio y guarda
   - **Then** los cambios se persisten y se reflejan inmediatamente

2. **Scenario**: Agregar productos a un set
   - **Given** el admin está editando un set
   - **When** agrega nuevos productos con sus cantidades
   - **Then** los productos se incluyen en el set sin perder los existentes

3. **Scenario**: Remover productos de un set
   - **Given** el set tiene varios productos
   - **When** el admin elimina un producto de la lista
   - **Then** el producto se remueve del set (pero no se elimina la entidad Product)

4. **Scenario**: Cambiar cantidad de un producto
   - **Given** un set tiene un producto con cantidad 2
   - **When** el admin cambia la cantidad a 5
   - **Then** la cantidad se actualiza correctamente

---

### User Story 3 - Activar/desactivar un set (Priority: P3)
El admin puede marcar un set como activo o inactivo, controlando su disponibilidad sin eliminarlo.

**Why this priority**: Permite al admin ocultar sets temporalmente (ej: fuera de stock) sin perder su configuración, datos históricos o afectar las órdenes existentes.

**Independent Test**: Admin puede togglear el estado activo/inactivo de un set y verificar que el cambio se persiste.

**Acceptance Scenarios**:
1. **Scenario**: Desactivar un set activo
   - **Given** un set está marcado como "activo"
   - **When** el admin cliquea en toggle/botón para desactivar
   - **Then** el set pasa a estado "inactivo" y no aparece en catálogo de cliente

2. **Scenario**: Activar un set inactivo
   - **Given** un set está marcado como "inactivo"
   - **When** el admin cliquea para activar
   - **Then** el set pasa a estado "activo" y aparece nuevamente en catálogo

3. **Scenario**: Activar set sin productos (validación)
   - **Given** un set no tiene productos asociados
   - **When** el admin intenta activarlo
   - **Then** se muestra un error indicando que el set debe tener al menos un producto

---

### User Story 4 - Eliminar un set (Priority: P4)
El admin puede eliminar un set de forma permanente, con confirmación previa. La eliminación no afecta los productos individuales que componían el set.

**Why this priority**: Necesario para limpiar sets obsoletos o con errores graves. Desactivar (Story 3) cubre la mayoría de casos; eliminar es para limpieza de datos.

**Independent Test**: Admin puede eliminar un set (con confirmación) y verificar que desaparece de la lista y de la base de datos. Los productos del set siguen existiendo.

**Acceptance Scenarios**:
1. **Scenario**: Eliminar set con confirmación
   - **Given** el admin cliquea el botón eliminar en un set
   - **When** confirma la acción en el diálogo
   - **Then** el set se elimina permanentemente de la base de datos

2. **Scenario**: Confirmación previene eliminación accidental
   - **Given** se muestra el diálogo de confirmación
   - **When** el admin cancela la acción
   - **Then** el set permanece intacto

3. **Scenario**: Eliminar set no afecta sus productos
   - **Given** un set contiene productos "Producto A" y "Producto B"
   - **When** se elimina el set
   - **Then** "Producto A" y "Producto B" siguen existiendo en el catálogo general

---

### User Story 5 - Ver lista de sets (Priority: P5)
El admin puede ver una tabla con todos los sets, mostrando nombre, precio, cantidad de items y estado (activo/inactivo).

**Why this priority**: Proporciona visibilidad general del inventario de sets. Soporte para paginar, buscar o filtrar puede agregarse en iteraciones futuras.

**Independent Test**: Admin accede a `/admin/sets` y ve una tabla con todos los sets creados, cada uno mostrando nombre, precio, cantidad de productos y estado.

**Acceptance Scenarios**:
1. **Scenario**: Ver tabla de sets
   - **Given** el admin navega a `/admin/sets`
   - **When** la página carga
   - **Then** aparece una tabla con todos los sets y sus atributos clave

2. **Scenario**: Indicador visual de estado
   - **Given** la tabla está visible
   - **When** hay sets activos e inactivos
   - **Then** cada set muestra claramente su estado (badge, ícono, etc.)

3. **Scenario**: Acceso rápido a edición
   - **Given** la tabla está visible
   - **When** el admin cliquea en una fila o botón de editar
   - **Then** se abre el formulario de edición para ese set

---

### Edge Cases
- **Slug duplicado**: Si el slug generado ya existe, agregar sufijo numérico (ej: "mi-set-premium-1").
- **Producto inactivo en set**: Un producto que fue desactivado después de agregarlo a un set, debe seguir visible en el set pero con una indicación visual para el admin (ej: label "Inactivo").
- **Set sin productos**: Permite crear un set vacío (draft), pero no permite activarlo hasta que tenga al least un producto.
- **Eliminar mientras hay órdenes**: Si MVP 1 no maneja órdenes, este edge case está fuera de scope actual. En futuro, considerar si permitir eliminar afecta órdenes históricas.
- **Actualizar cantidad a 0**: Si el admin intenta cambiar cantidad a 0 o valores inválidos, se rechaza y se muestra validación.

## Out of Scope
- **Cálculo automático de precio**: El precio del set no se calcula automáticamente sumando los precios de sus productos. El admin define el precio manualmente.
- **Stock/inventario por set**: Control de stock por set (MVP 2).
- **Opciones de producto variable**: Sets con productos que tienen múltiples opciones/tallas/colores (ej: "Mate tamaño M o L"). Cada producto agregado a un set tiene cantidad fija.
- **Historial de cambios**: Auditoría o versionado de cambios en sets.
- **Reordenamientos de productos**: Cambiar el orden de productos dentro de un set.
- **Checkout y flujo de compra**: La funcionalidad de venta y checkout es MVP 2+.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Admin puede crear un set especificando nombre, descripción, precio, categoría e imágenes.
- **FR-002**: Slug del set se genera automáticamente de forma URL-safe y debe ser único.
- **FR-003**: Admin puede agregar productos a un set con cantidad específica.
- **FR-004**: Admin puede editar todos los campos de un set existente (nombre, descripción, precio, categoría, imágenes, productos).
- **FR-005**: Admin puede remover productos de un set sin eliminar la entidad Product.
- **FR-006**: Admin puede cambiar el estado activo/inactivo de un set para controlar su disponibilidad.
- **FR-007**: Admin no puede activar un set que no tenga al menos un producto.
- **FR-008**: Admin puede eliminar un set de forma permanente con confirmación previa.
- **FR-009**: Eliminar un set no elimina sus productos individuales.
- **FR-010**: Admin puede ver una tabla con todos los sets (nombre, precio, cantidad de items, estado activo/inactivo).
- **FR-011**: Admin puede acceder al formulario de edición desde la tabla de sets.

### Key Entities
- **MateSet**: Representa un bundle/combo de productos con campos: `id`, `name`, `slug`, `description`, `price`, `images[]`, `category_id`, `category` (relación), `is_active`, `set_items[]`, `created_at`.
- **SetItem**: Referencia al **mismo `product_id`** que existe en el catálogo individual. No se duplica el producto — es la misma entidad. Esto es intencional: cuando en MVP 2 se gestione stock, descontar unidades de un set descuenta del mismo stock que el producto individual.
- **SetItem**: Representa la relación entre un set y sus productos con campos: `id`, `set_id`, `product_id`, `product` (referencia), `quantity`.
- **Product**: Producto individual que puede pertenecer a cero o más sets. No se ve afectado por eliminación de sets.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Admin puede crear, leer, editar y eliminar sets desde `/admin/sets` sin errores.
- **SC-002**: Todos los campos del set (nombre, slug, descripción, precio, imágenes, productos) se persisten y recuperan correctamente desde la base de datos.
- **SC-003**: El slug se genera automáticamente y se valida como único; duplicados son rechazados o autoresolutos.
- **SC-004**: Admin no puede activar sets sin productos; al intentarlo se muestra validación clara.
- **SC-005**: La tabla de sets muestra estado correcto (activo/inactivo) y permite navegación rápida a edición.
- **SC-006**: Eliminar un set no afecta los productos que lo integraban (verified por query a BD).
- **SC-007**: Todos los cambios en sets se reflejan inmediatamente en la UI sin necesidad de refresco manual.
