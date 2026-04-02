# Feature Specification: Variaciones de Producto

**Created**: 2026-03-15

## Contexto del negocio
Muchos productos tienen variantes visuales (ej: "Bombilla con grabado de perro", "de gato", "de pájaro")
que son esencialmente el mismo producto pero con imágenes y presentación distinta. No se justifica
crear productos separados ya que comparten nombre, descripción y precio. Las variaciones resuelven
esto: un solo producto en el catálogo con múltiples opciones seleccionables.

**Cambio arquitectónico (v2)**: El concepto de "producto padre" fue eliminado. Ahora todas las imágenes
viven en variaciones. Una variación tiene `is_default = true` y es la que se preselecciona en la VIP
y se muestra en el catálogo. El admin puede cambiar cuál es la default sin perder datos.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Admin agrega variaciones a un producto (Priority: P1)
El admin puede agregar variaciones a un producto existente, cada una con su propio label e imágenes.

**Why this priority**: Sin esto el feature no existe. Es el flujo de creación de datos.

**Independent Test**: Admin abre un producto, agrega 3 variaciones (Rojo, Azul, Verde) con fotos distintas, guarda, y las ve listadas en el formulario.

**Acceptance Scenarios**:
1. **Scenario**: Admin agrega una variación con label e imágenes
   - **Given** El admin edita un producto existente
   - **When** Hace clic en "Agregar variación", escribe "Perro", sube 2 fotos y guarda
   - **Then** La variación queda guardada y aparece en la lista de variaciones del producto

2. **Scenario**: Admin intenta agregar variación sin label
   - **Given** El admin está en el formulario de variaciones
   - **When** Deja el campo label vacío e intenta guardar
   - **Then** Recibe error de validación "El label es obligatorio"

3. **Scenario**: Admin agrega variación sin imágenes
   - **Given** El admin escribe "Verde" como label pero no sube fotos
   - **When** Guarda la variación
   - **Then** La variación se guarda sin imágenes (válido; puede agregarlas después)

4. **Scenario**: Admin desactiva una variación
   - **Given** Un producto tiene 3 variaciones activas
   - **When** El admin desactiva la variación "Rojo"
   - **Then** "Rojo" deja de aparecer en el storefront pero sigue en el admin como inactiva

---

### User Story 2 — Admin edita o elimina una variación (Priority: P2)
El admin puede cambiar el label, las imágenes o el estado de una variación, o eliminarla.

**Why this priority**: El admin comete errores o cambia stock de variaciones.

**Independent Test**: Admin edita el label "Perro" → "Perrito", guarda y lo ve actualizado en el storefront.

**Acceptance Scenarios**:
1. **Scenario**: Admin edita el label de una variación
   - **Given** Existe la variación "Perro"
   - **When** El admin lo cambia a "Perrito" y guarda
   - **Then** El storefront muestra "Perrito"

2. **Scenario**: Admin elimina una variación
   - **Given** Una variación no está vinculada a ningún set
   - **When** El admin la elimina con confirmación
   - **Then** Se elimina de la tabla y sus imágenes se eliminan de Storage

3. **Scenario**: Admin intenta eliminar variación vinculada a un set
   - **Given** La variación "Rojo" está en el set "Kit verano"
   - **When** El admin intenta eliminar "Rojo"
   - **Then** Recibe advertencia: "Esta variación está incluida en el set 'Kit verano'. Editá el set primero."

4. **Scenario**: Admin reordena variaciones
   - **Given** Un producto tiene 3 variaciones
   - **When** El admin cambia el orden usando los controles de ordenamiento
   - **Then** El storefront las muestra en el nuevo orden

---

### User Story 3 — Visitante ve y selecciona variaciones en la VIP (Priority: P1)
En la página de detalle del producto, el visitante ve las variaciones disponibles como chips con imagen + label,
y al hacer clic en una, la galería principal cambia a las imágenes de esa variación.

**Why this priority**: Es la experiencia central del feature para el usuario final.

**Independent Test**: Visitante abre `/producto/bombilla-artesanal`, ve 3 chips de variaciones con la primera (default) preseleccionada, puede hacer clic en "Perro" y la galería cambia a esas fotos, y puede volver a hacer clic en la primera para volver a las imágenes default.

**Acceptance Scenarios**:
1. **Scenario**: Visitante llega a la VIP — la variación default está preseleccionada
   - **Given** Un producto tiene 3 variaciones activas (una con `is_default = true`)
   - **When** El visitante abre la VIP
   - **Then** La galería muestra las imágenes de la variación `is_default`. Los chips muestran todas las variaciones, con la default visualmente destacada.

2. **Scenario**: Visitante selecciona otra variación
   - **Given** El visitante está en la VIP con la variación default seleccionada
   - **When** Hace clic en el chip "Gato"
   - **Then** La galería principal reemplaza sus imágenes por las de la variación "Gato". El chip "Gato" queda marcado como activo, la default pierde el highlight.

3. **Scenario**: Visitante vuelve a seleccionar la variación default
   - **Given** El chip "Gato" está seleccionado
   - **When** El visitante hace clic en la variación default (la que tenía highlight)
   - **Then** La galería vuelve a las imágenes de la variación default. El chip vuelve a tener el highlight.

4. **Scenario**: Variación sin imágenes propias
   - **Given** La variación "Verde" no tiene imágenes pero su variación padre (default) sí
   - **When** El visitante selecciona "Verde"
   - **Then** La galería muestra las imágenes del default como fallback (no queda vacía)

5. **Scenario**: Producto sin variaciones
   - **Given** Un producto no tiene variaciones (edge case raro, idealmente no ocurre)
   - **When** El visitante abre la VIP
   - **Then** No se muestra ninguna sección de variaciones (comportamiento actual sin cambios)

---

### User Story 4 — Card en catálogo para productos con variaciones (Priority: P2)
La card de un producto con variaciones muestra la imagen de la variación default, sin cambios visuales respecto a productos sin variaciones.

**Why this priority**: El catálogo debe ser consistente. El admin decide qué imagen ve el comprador.

**Independent Test**: Un producto con 4 variaciones aparece en el catálogo con la imagen de la variación `is_default = true`. Si el admin cambia cuál es default, la imagen cambia automáticamente en el catálogo.

**Acceptance Scenarios**:
1. **Scenario**: Card muestra imagen de la variación default
   - **Given** Un producto tiene 3 variaciones activas, una con `is_default = true` que tiene imágenes
   - **When** El visitante ve el catálogo
   - **Then** La card muestra `images[0]` de la variación default, sin indicador de variaciones

2. **Scenario**: Card de producto cuando admin cambia la default
   - **Given** La card mostraba la imagen de "Variación A" (era default)
   - **When** El admin va al admin panel y marca "Variación B" como default
   - **Then** La card del catálogo ahora muestra automáticamente `images[0]` de "Variación B" (sin refresh manual)

---

### User Story 5 — Admin agrega variación específica a un set (Priority: P2)
Al armar un set, si el admin agrega un producto que tiene variaciones, debe elegir cuál variación incluir.

**Why this priority**: Los sets son presentaciones específicas de productos; hay que mostrar exactamente qué variante viene.

**Independent Test**: Admin arma un set, agrega el producto "Bombilla artesanal" (que tiene 3 variaciones), y el sistema le pide elegir una. Guarda "Gato". El set muestra la foto del gato.

**Acceptance Scenarios**:
1. **Scenario**: Admin agrega al set un producto con variaciones
   - **Given** El admin está armando un set y selecciona "Bombilla artesanal" (con variaciones)
   - **When** Confirma la selección del producto
   - **Then** Aparece un selector secundario con las variaciones activas para elegir una

2. **Scenario**: Admin agrega al set un producto sin variaciones
   - **Given** El admin selecciona "Mate de madera" (sin variaciones)
   - **When** Confirma la selección
   - **Then** Se agrega directamente sin selector secundario (comportamiento actual)

3. **Scenario**: Admin edita el set y cambia la variación elegida
   - **Given** El set tiene "Bombilla Gato"
   - **When** El admin cambia la variación a "Bombilla Perro"
   - **Then** El set_item actualiza su `variation_id` y el set muestra la foto del perro

---

### Edge Cases
- **Producto con variaciones sin imágenes propias en el padre**: La card usa `images[0]` de la primera variación activa
- **Todas las variaciones inactivas**: El bloque de variaciones no se muestra en la VIP
- **Variación eliminada vinculada a set**: Bloquear eliminación con advertencia (o al eliminar, set_item.variation_id → NULL y mostrar advertencia en admin del set)
- **Reordenamiento**: El primer elemento activo en `sort_order` es el que se pre-selecciona visualmente como default en la VIP (aunque no cambia las imágenes)

## Out of Scope
- Variaciones con precio diferente (si cambia el precio → producto nuevo)
- Múltiples tipos de atributo por producto (ej: color × tamaño) — posible extensión futura
- Stock por variación (MVP 2 — el campo se reserva en DB pero no se implementa en UI)
- Variaciones para sets o colecciones
- Agregar el mismo producto con todas sus variaciones a un set y que el comprador elija en el checkout
- Productos sin variaciones (todos los productos deben tener al menos una variación default)

## Cambios desde v1
**v1 (legacy)**: Concepto de "producto padre" con `products.images[]` separado de variaciones. UX pobre: no había forma de volver al "padre" desde otra variación.

**v2 (actual)**: Eliminación del concepto padre. Todas las imágenes viven en variaciones. Una variación es `is_default = true`:
- Se preselecciona en la VIP automáticamente
- Se muestra en el catálogo automáticamente
- El admin puede cambiarla sin perder datos
- Transición automática: la migración 005 convierte `products.images[]` en variaciones default

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Un producto puede tener 0 o N variaciones activas (mínimo recomendado: 1)
- **FR-002**: Cada variación tiene: label (obligatorio), images[] (opcional), is_active, **is_default**, sort_order
- **FR-003**: El precio no varía entre variaciones; si cambia → es un producto nuevo
- **FR-004**: La VIP muestra las variaciones activas del producto como chips (imagen + label)
- **FR-005**: Al seleccionar un chip en la VIP, la galería principal cambia a las imágenes de esa variación
- **FR-006**: Si la variación seleccionada no tiene imágenes, la galería muestra las de la variación default
- **FR-007**: Al cargar la VIP, la galería muestra automáticamente las imágenes de la variación `is_default = true` (preseleccionada)
- **FR-008**: La card en el catálogo muestra `images[0]` de la variación con `is_default = true`
- **FR-009**: Al agregar un producto con variaciones a un set, el admin debe elegir una variación específica
- **FR-010**: Al agregar un producto sin variaciones a un set, no se muestra selector de variación
- **FR-011**: La eliminación de una variación vinculada a un set está bloqueada con advertencia
- **FR-012**: El admin puede desactivar una variación sin eliminarla (pero si es default, debe elegir otra antes)
- **FR-013**: Solo una variación por producto puede tener `is_default = true`. Cuando se marca una como default, las demás se marcan como false automáticamente
- **FR-014**: El campo `stock` se reserva en la tabla DB para MVP 2 pero no se expone en UI

### Key Entities
- **ProductVariation**: id, product_id, label, images[], is_active, **is_default**, sort_order, (stock futuro), created_at
  - `is_default`: boolean, NOT NULL DEFAULT false. Garantiza unicidad: solo UNA variación por producto puede tener `is_default = true`
- **Product** (existente, sin cambios de columnas): `images[]` se migraron a variaciones. Campo mantiene compatibilidad pero es legacy.
- **SetItem** (existente): se agrega columna `variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL`

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: El admin puede crear, editar, desactivar variaciones y cambiar cuál es default desde el formulario de producto
- **SC-002**: Un visitante puede seleccionar una variación en la VIP y ver sus imágenes en < 100ms (cambio local, sin request)
- **SC-003**: La card del catálogo muestra la imagen de la variación default automáticamente
- **SC-004**: Un set con variación muestra correctamente la imagen de esa variación
- **SC-005**: No es posible eliminar una variación vinculada a un set sin advertencia previa
- **SC-006**: La DB está preparada para agregar stock por variación en MVP 2 sin migración destructiva
- **SC-007**: Cuando el admin cambia la variación default en el panel admin, la imagen del catálogo se actualiza en tiempo real (sin refresh manual)
- **SC-008**: El admin ve un ícono (⭐) que indica cuál es la variación default
- **SC-009**: La variación default nunca puede quedar sin imágenes (fallback automático a la default si una variación no tiene propias)
