# Feature Specification: Gestión de Colecciones (Admin)

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear una nueva colección (Priority: P1)
El admin necesita crear colecciones manuales para agrupar productos y sets relacionados por temática, temporada u otro criterio.

**Why this priority**: Es la funcionalidad base sin la cual no pueden existir colecciones. Bloquea todas las demás historias.

**Independent Test**: El admin accede a `/admin/colecciones`, hace clic en "Nueva colección", completa el formulario con nombre, descripción, carga imágenes, selecciona productos y/o sets, y guarda la colección.

**Acceptance Scenarios**:
1. **Scenario**: Crear colección con productos
   - **Given** El admin está en la página de colecciones
   - **When** Completa formulario con nombre "Colección Otoño", slug autogenerado, descripción, al menos una imagen, selecciona 3 productos y hace clic en "Guardar"
   - **Then** La colección se crea exitosamente, aparece en la lista, y los productos están asociados

2. **Scenario**: Crear colección con sets
   - **Given** El admin está en la página de colecciones
   - **When** Completa formulario con nombre "Novedades", slug autogenerado, selecciona 2 sets, marca como activa y guarda
   - **Then** La colección se crea con los sets asociados y es visible de inmediato

3. **Scenario**: Crear colección sin productos ni sets
   - **Given** El admin está creando una colección
   - **When** Completa nombre, descripción, imagen pero no selecciona productos ni sets, intenta activarla
   - **Then** El sistema muestra error indicando que se requiere al menos un producto o set para activar

4. **Scenario**: Slug único
   - **Given** Ya existe una colección con slug "otoño"
   - **When** El admin intenta crear otra colección con el mismo slug
   - **Then** El sistema rechaza y solicita un slug diferente

---

### User Story 2 - Editar una colección existente (Priority: P2)
El admin necesita poder modificar cualquier aspecto de una colección ya creada: nombre, descripción, imágenes y asociaciones de productos/sets.

**Why this priority**: Funcionalidad crítica post-creación. Necesaria para mantener colecciones al día sin eliminar/recrear.

**Independent Test**: El admin abre una colección existente desde la lista, modifica nombre, agrega/quita productos, carga nuevas imágenes, y guarda los cambios.

**Acceptance Scenarios**:
1. **Scenario**: Editar nombre y descripción
   - **Given** Existe una colección "Otoño" con productos
   - **When** El admin abre la colección, cambia nombre a "Colección Otoño 2026", modifica descripción y guarda
   - **Then** Los cambios se persisten, slug se actualiza si es necesario, y los productos permanecen asociados

2. **Scenario**: Agregar y remover productos
   - **Given** Una colección tiene 3 productos
   - **When** El admin agrega 2 nuevos productos y remueve 1 existente
   - **Then** La colección ahora tiene 4 productos, el removido se desasocia pero no se elimina, los demás permanecen

3. **Scenario**: Mezclar productos y sets
   - **Given** Una colección sólo tenía productos
   - **When** El admin agrega 2 sets adicionales
   - **Then** La colección contiene tanto productos como sets asociados

4. **Scenario**: Actualizar imágenes
   - **Given** Una colección tiene 2 imágenes
   - **When** El admin elimina una imagen y carga 2 nuevas
   - **Then** La colección finalmente tiene 3 imágenes, la galería se actualiza

---

### User Story 3 - Activar/desactivar una colección (Priority: P3)
El admin necesita poder controlar la visibilidad de una colección sin eliminarla, permitiendo toggle rápido entre activa/inactiva.

**Why this priority**: Importante para manage temporalidad de colecciones (ej: colección estacional). Evita eliminar/recrear.

**Independent Test**: El admin selecciona una colección activa, la desactiva, verifica que desaparece de la tienda, luego la reactiva.

**Acceptance Scenarios**:
1. **Scenario**: Desactivar colección
   - **Given** Una colección está activa (is_active: true)
   - **When** El admin hace clic en toggle "Activa" para desactivarla
   - **Then** La colección se marca como inactiva, no aparece en `/colecciones` para el visitante, pero permanece en admin

2. **Scenario**: Reactivar colección
   - **Given** Una colección está inactiva
   - **When** El admin hace clic en toggle para activarla de nuevo
   - **Then** La colección vuelve a ser visible en la tienda de inmediato

3. **Scenario**: Desactivar requiere al menos un item
   - **Given** Una colección vacía (sin productos ni sets)
   - **When** El admin intenta activarla
   - **Then** El sistema muestra error indicando que necesita al menos un producto o set

---

### User Story 4 - Eliminar una colección (Priority: P4)
El admin necesita poder eliminar colecciones permanentemente, con confirmación para evitar eliminaciones accidentales. La eliminación no afecta productos ni sets.

**Why this priority**: Importante para limpieza de datos, pero menos crítico que CRUD básico. Implementarse después de crear/editar.

**Independent Test**: El admin selecciona una colección, hace clic en "Eliminar", confirma en modal, y la colección desaparece de la lista.

**Acceptance Scenarios**:
1. **Scenario**: Eliminar colección con productos
   - **Given** Una colección contiene 5 productos
   - **When** El admin hace clic en "Eliminar" y confirma
   - **Then** La colección se elimina, los 5 productos permanecen en la tienda, la colección no aparece más

2. **Scenario**: Confirmación de eliminación
   - **Given** El admin abre modal de confirmación de eliminación
   - **When** Hace clic en "Cancelar"
   - **Then** La colección no se elimina y modal se cierra

3. **Scenario**: Eliminar colección vacía
   - **Given** Existe una colección sin productos ni sets
   - **When** El admin la elimina y confirma
   - **Then** Se elimina sin restricciones adicionales

---

### User Story 5 - Ver lista de colecciones (Priority: P5)
El admin necesita visualizar todas las colecciones en una tabla con información clave: nombre, cantidad de items, estado activo/inactivo.

**Why this priority**: Funcionalidad base de visualización. Implementarse primero, junto con P1.

**Independent Test**: El admin accede a `/admin/colecciones` y ve tabla con todas las colecciones, sus conteos y estados.

**Acceptance Scenarios**:
1. **Scenario**: Listar colecciones
   - **Given** Existen 5 colecciones en el sistema
   - **When** El admin accede a `/admin/colecciones`
   - **Then** Ve tabla con las 5 colecciones: nombre, cantidad de productos + sets, estado activo/inactivo

2. **Scenario**: Colección sin items
   - **Given** Una colección está vacía
   - **When** El admin ve la lista
   - **Then** Muestra "0 items" en esa fila, y no puede activarla

3. **Scenario**: Ordenamiento y búsqueda
   - **Given** Hay múltiples colecciones
   - **When** El admin intenta filtrar o buscar por nombre
   - **Then** La tabla se actualiza mostrando coincidencias (búsqueda básica por nombre)

---

### Edge Cases
- **Slug único**: El sistema valida que no exista otro slug idéntico al crear/editar.
- **Colección vacía**: Puede guardarse como borrador, pero no puede activarse sin al menos 1 producto o set.
- **Producto inactivo en colección**: Permanece en la lista del admin pero no se muestra al visitante.
- **Remover producto de colección**: El producto NO se elimina, solo se desasocia de la colección.
- **Imágenes de colección**: Pueden ser múltiples, se permiten agregar/eliminar independientemente.

## Out of Scope
- Población automática/basada en reglas de colecciones
- Reordenamiento de items dentro de una colección
- Analíticas de colecciones (vistas, clics, conversiones)
- Asignación masiva (ej: agregar todos los productos de una categoría a una colección de una vez)
- Historial de cambios / auditoría de colecciones
- Exportación de datos de colecciones

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Crear colección con nombre, slug (auto-generado, editable, único), descripción opcional, múltiples imágenes, estado activo/inactivo.
- **FR-002**: Seleccionar y asociar 0 o más productos y 0 o más sets a una colección (many-to-many).
- **FR-003**: Editar todos los campos de una colección existente.
- **FR-004**: Agregar y remover productos/sets de una colección sin eliminar los items.
- **FR-005**: Toggle activa/inactiva en una colección; requerido al menos 1 item para activar.
- **FR-006**: Eliminar una colección con confirmación; no elimina productos ni sets.
- **FR-007**: Listar todas las colecciones en tabla con nombre, cantidad total de items (productos + sets), estado activo.
- **FR-008**: Validar unicidad de slug dentro de todas las colecciones.
- **FR-009**: Restricción: solo usuario admin autenticado en Supabase Auth puede acceder a `/admin/colecciones`.

### Key Entities
- **Collection**: id, name, slug (unique), description, images (array), is_active, created_at, products (via junction), sets (via junction).
- **Product**: id, name, slug, price (nullable), images, is_active.
- **MateSet**: id, name, slug, price, images, is_active.
- **Junction Tables**: collection_products (collection_id, product_id), collection_sets (collection_id, set_id).

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: Admin puede crear una colección con productos/sets en menos de 60 segundos desde `/admin/colecciones`.
- **SC-002**: 100% de las colecciones creadas tienen slug único y válido.
- **SC-003**: Edición de colección persiste todos los cambios (nombre, descripción, imágenes, items) sin pérdida de datos.
- **SC-004**: Remover un producto de una colección no elimina el producto del sistema.
- **SC-005**: Colecciones inactivas no aparecen en la tienda pública (`/colecciones`), solo en admin.
- **SC-006**: Tabla de colecciones carga y renderiza 50+ colecciones sin lag perceptible.
- **SC-007**: Código introducido tiene mínimo 85% coverage de tests unitarios.
