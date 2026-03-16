# Feature Specification: Variaciones de Producto

**Created**: 2026-03-15

## Contexto del negocio
Muchos productos tienen variantes visuales (ej: "Bombilla con grabado de perro", "de gato", "de pájaro")
que son esencialmente el mismo producto pero con imágenes y presentación distinta. No se justifica
crear productos separados ya que comparten nombre, descripción y precio. Las variaciones resuelven
esto: un solo producto en el catálogo con múltiples opciones seleccionables.

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

**Independent Test**: Visitante abre `/producto/bombilla-artesanal`, ve 3 chips de variaciones, hace clic en "Perro" y la galería principal cambia a las fotos del perro.

**Acceptance Scenarios**:
1. **Scenario**: Visitante llega a la VIP sin seleccionar variación
   - **Given** Un producto tiene 3 variaciones activas
   - **When** El visitante abre la VIP
   - **Then** La galería muestra las imágenes del **producto padre** (default). Las variaciones se muestran debajo como chips sin ninguna seleccionada.

2. **Scenario**: Visitante selecciona una variación
   - **Given** El visitante está en la VIP
   - **When** Hace clic en el chip "Gato"
   - **Then** La galería principal reemplaza sus imágenes por las de la variación "Gato". El chip queda marcado como activo.

3. **Scenario**: Visitante vuelve a hacer clic en la variación activa
   - **Given** El chip "Gato" está seleccionado
   - **When** El visitante lo vuelve a hacer clic
   - **Then** Se deselecciona y la galería vuelve a las imágenes del producto padre

4. **Scenario**: Variación sin imágenes propias
   - **Given** La variación "Verde" no tiene imágenes
   - **When** El visitante selecciona "Verde"
   - **Then** La galería muestra las imágenes del producto padre como fallback (no queda vacía)

5. **Scenario**: Producto sin variaciones
   - **Given** Un producto no tiene variaciones
   - **When** El visitante abre la VIP
   - **Then** No se muestra ninguna sección de variaciones (comportamiento actual sin cambios)

---

### User Story 4 — Card en catálogo para productos con variaciones (Priority: P2)
La card de un producto con variaciones muestra la imagen del producto padre, sin cambios visuales respecto a productos sin variaciones.

**Why this priority**: El catálogo debe ser consistente. La variación es un detalle de la VIP.

**Independent Test**: Un producto con 4 variaciones aparece en el catálogo con la imagen del padre, igual que un producto sin variaciones.

**Acceptance Scenarios**:
1. **Scenario**: Card muestra imagen del producto padre
   - **Given** Un producto tiene `images[]` propio y 3 variaciones con sus imágenes
   - **When** El visitante ve el catálogo
   - **Then** La card muestra `images[0]` del padre, sin indicador de variaciones

2. **Scenario**: Card de producto con variaciones pero sin imagen padre
   - **Given** El producto padre no tiene `images[]` pero sus variaciones sí tienen
   - **When** El visitante ve el catálogo
   - **Then** La card muestra `images[0]` de la primera variación activa como fallback

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

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Un producto puede tener 0 o N variaciones activas
- **FR-002**: Cada variación tiene: label (obligatorio), images[] (opcional), is_active, sort_order
- **FR-003**: El precio no varía entre variaciones; si cambia → es un producto nuevo
- **FR-004**: La VIP muestra las variaciones activas del producto como chips (imagen + label)
- **FR-005**: Al seleccionar un chip en la VIP, la galería principal cambia a las imágenes de esa variación
- **FR-006**: Si la variación seleccionada no tiene imágenes, la galería muestra las del producto padre
- **FR-007**: Al cargar la VIP, la galería muestra las imágenes del producto padre (ninguna variación preseleccionada)
- **FR-008**: La card en el catálogo muestra `images[0]` del producto padre; si no tiene, `images[0]` de la primera variación activa
- **FR-009**: Al agregar un producto con variaciones a un set, el admin debe elegir una variación específica
- **FR-010**: Al agregar un producto sin variaciones a un set, no se muestra selector de variación
- **FR-011**: La eliminación de una variación vinculada a un set está bloqueada con advertencia
- **FR-012**: El admin puede desactivar una variación sin eliminarla
- **FR-013**: El campo `stock` se reserva en la tabla DB para MVP 2 pero no se expone en UI

### Key Entities
- **ProductVariation**: id, product_id, label, images[], is_active, sort_order, (stock futuro), created_at
- **Product** (existente, sin cambios de columnas): `images[]` sigue siendo el default/cover
- **SetItem** (existente): se agrega columna `variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL`

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: El admin puede crear, editar y desactivar variaciones desde el formulario de producto
- **SC-002**: Un visitante puede seleccionar una variación en la VIP y ver sus imágenes en < 100ms (cambio local, sin request)
- **SC-003**: La card del catálogo no cambia visualmente para productos con variaciones
- **SC-004**: Un set con variación muestra correctamente la imagen de esa variación
- **SC-005**: No es posible eliminar una variación vinculada a un set sin advertencia previa
- **SC-006**: La DB está preparada para agregar stock por variación en MVP 2 sin migración destructiva
