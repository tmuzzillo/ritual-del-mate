# Feature Specification: Gestión de Productos (Admin)

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear un producto nuevo (Priority: P1)
El admin puede crear un nuevo producto desde la sección de administración con todos los detalles necesarios para publicar en el catálogo.

**Why this priority**: Es el flujo fundamental del feature. Sin la capacidad de crear productos, no hay catálogo que mostrar.

**Independent Test**: Admin completa el formulario de creación, envía, y ve el producto listado en la tabla de productos.

**Acceptance Scenarios**:
1. **Scenario**: Admin crea un producto con todos los campos requeridos
   - **Given** El admin está autenticado y en `/admin/productos`
   - **When** Completa el formulario (nombre, descripción, precio, categoría, sube imágenes) y hace clic en "Crear"
   - **Then** El producto se guarda, el slug se genera automáticamente del nombre, y aparece en la lista de productos activos

2. **Scenario**: El slug generado automáticamente ya existe
   - **Given** El admin intenta crear un producto cuyo nombre generaría un slug duplicado
   - **When** Envía el formulario
   - **Then** Recibe un error indicando que el slug ya está en uso y puede editarlo manualmente

3. **Scenario**: El admin intenta publicar sin imágenes
   - **Given** El formulario está completo excepto por imágenes
   - **When** Intenta marcar el producto como activo (is_active = true)
   - **Then** El sistema muestra un error: "Debe subir al menos una imagen para publicar"

4. **Scenario**: Precio inválido cuando se especifica
   - **Given** El admin ingresa un precio inválido (negativo, cero, o texto)
   - **When** Intenta enviar el formulario
   - **Then** Recibe un error de validación indicando que el precio, si se especifica, debe ser mayor a 0

---

### User Story 2 - Editar un producto existente (Priority: P2)
El admin puede modificar cualquier campo de un producto ya creado (nombre, descripción, precio, categoría, imágenes, estado).

**Why this priority**: Después de crear productos, el admin necesita poder corregir errores o actualizar información. Es crítico para mantener el catálogo correcto.

**Independent Test**: Admin accede a un producto, cambia varios campos, guarda, y verifica que los cambios se reflejan.

**Acceptance Scenarios**:
1. **Scenario**: Admin edita el nombre de un producto
   - **Given** El admin abre la página de edición de un producto
   - **When** Cambia el nombre y guarda
   - **Then** El slug se regenera automáticamente del nuevo nombre (si el slug no está en uso)

2. **Scenario**: Admin intenta cambiar el slug a uno que ya existe
   - **Given** El admin está editando un producto e intenta cambiar su slug manualmente
   - **When** El nuevo slug ya está en uso por otro producto
   - **Then** Recibe un error de validación

3. **Scenario**: Admin remueve todas las imágenes y quiere mantener activo
   - **Given** El producto está activo y tiene imágenes
   - **When** El admin elimina todas las imágenes e intenta guardar con is_active = true
   - **Then** El sistema muestra un error: "Un producto activo debe tener al menos una imagen"

---

### User Story 3 - Cambiar estado activo/inactivo de un producto (Priority: P3)
El admin puede activar o desactivar un producto rápidamente sin eliminarlo, para controlar su visibilidad en el catálogo público.

**Why this priority**: Cambiar disponibilidad sin eliminar es más seguro que borrar. Permite pausar productos temporalmente.

**Independent Test**: Admin hace clic en un botón toggle en la lista o en la página de edición y ve el estado cambiar.

**Acceptance Scenarios**:
1. **Scenario**: Admin desactiva un producto desde la lista
   - **Given** Un producto activo está en la tabla de productos
   - **When** El admin hace clic en el toggle de estado
   - **Then** El producto cambia a inactivo y desaparece del catálogo público

2. **Scenario**: Admin activa un producto que estaba inactivo
   - **Given** Un producto inactivo tiene al menos una imagen
   - **When** El admin cambia su estado a activo
   - **Then** El producto ahora aparece en el catálogo público

3. **Scenario**: Admin intenta activar un producto sin imágenes
   - **Given** Un producto inactivo no tiene imágenes asignadas
   - **When** El admin intenta marcar como activo
   - **Then** Recibe un error: "No puede activar un producto sin imágenes"

---

### User Story 4 - Eliminar un producto (Priority: P4)
El admin puede eliminar permanentemente un producto del sistema con una confirmación previa.

**Why this priority**: Necesario para limpiar productos errados o descontinuados, pero de menor prioridad que crear/editar.

**Independent Test**: Admin hace clic en eliminar, confirma en un diálogo, y el producto desaparece de la lista.

**Acceptance Scenarios**:
1. **Scenario**: Admin elimina un producto exitosamente
   - **Given** El admin abre un producto y ve el botón de eliminar
   - **When** Hace clic en "Eliminar" y confirma en el diálogo de confirmación
   - **Then** El producto se elimina permanentemente y la tabla se actualiza

2. **Scenario**: Admin intenta eliminar un producto vinculado a un conjunto
   - **Given** El producto está asociado a un conjunto (set) de productos
   - **When** El admin intenta eliminarlo
   - **Then** Recibe una advertencia: "Este producto está en un conjunto. Elimínelo del conjunto primero o desactive la vinculación"

3. **Scenario**: Admin cancela la eliminación
   - **Given** Un diálogo de confirmación está abierto
   - **When** El admin hace clic en "Cancelar"
   - **Then** El diálogo se cierra sin eliminar nada

---

### User Story 5 - Ver lista de productos (Priority: P5)
El admin ve todos los productos en una tabla con información clave para gestionar el catálogo rápidamente.

**Why this priority**: Interfaz de visualización. Menos urgente que crear/editar, pero necesaria para navegar.

**Independent Test**: Admin accede a `/admin/productos` y ve una tabla con productos, sus detalles, y opciones de acción.

**Acceptance Scenarios**:
1. **Scenario**: La tabla muestra todos los productos con sus detalles
   - **Given** El admin navega a `/admin/productos`
   - **When** La página carga
   - **Then** Ve una tabla con: nombre, precio, categoría, estado (activo/inactivo), y botones de acción (editar, eliminar)

2. **Scenario**: La tabla está vacía cuando no hay productos
   - **Given** No hay productos en la base de datos
   - **When** El admin accede a la página
   - **Then** Ve un mensaje indicando que no hay productos y un botón para crear uno

3. **Scenario**: Admin accede a un producto para editarlo desde la lista
   - **Given** La tabla está llena de productos
   - **When** El admin hace clic en el nombre de un producto o en el botón "Editar"
   - **Then** Se abre la página de edición del producto

---

### Edge Cases
- **Slug duplicado al crear o editar**: Mostrar error claro y permitir edición manual del slug
- **Precio no positivo**: Validar en frontend y backend; rechazar valores menores o iguales a 0
- **Activar sin imágenes**: No permitir; mostrar error si el admin intenta publicar sin al menos una imagen
- **Producto sin categoría**: Permitir, pero mostrar advertencia en la lista
- **Producto vinculado a conjuntos**: Prevenir eliminación directa; sugerir desvinculación primero
- **Campos vacíos o inválidos**: Validación en frontend con mensajes claros; validación en backend antes de guardar
- **Caracteres especiales en slug**: Convertir a slug válido (minúsculas, guiones) o mostrar error si no es válido

## Out of Scope
- Gestión de stock (MVP 2)
- Variantes de productos (tamaños, colores)
- Acciones en lote (eliminar, activar múltiples productos)
- Reordenamiento de imágenes
- Editor de texto enriquecido para descripciones
- Importación masiva de productos
- Historial de cambios/auditoría
- Búsqueda y filtrado avanzado en la tabla

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El admin puede crear un producto con nombre, slug (auto-generado, editable), descripción, precio (opcional), categoría, imágenes y estado activo/inactivo
- **FR-002**: El slug se genera automáticamente transformando el nombre en formato slug (minúsculas, guiones)
- **FR-003**: El sistema valida que el slug sea único antes de guardar
- **FR-004**: El admin puede editar todos los campos de un producto existente
- **FR-005**: El admin puede activar/desactivar un producto sin eliminarlo
- **FR-006**: El admin no puede activar un producto sin al menos una imagen
- **FR-007**: El admin puede eliminar un producto con una confirmación previa (diálogo de confirmación)
- **FR-008**: El sistema previene la eliminación de productos vinculados a conjuntos (con advertencia)
- **FR-009**: El admin ve una tabla de todos los productos con columnas: nombre, precio, categoría, estado, acciones
- **FR-010**: El precio es opcional. Si se especifica, debe ser un número positivo (> 0)
- **FR-011**: El admin puede navegar a la página de edición desde la tabla de productos

### Key Entities
- **Product**: id, name, slug, description, price (number | null), stock, images (array de strings), category_id, category (relación), is_active, created_at
- **Category**: id, name, slug, created_at

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: El admin puede crear un nuevo producto desde cero hasta publicado en < 2 minutos (con imágenes)
- **SC-002**: Todos los campos editables se pueden modificar sin perder datos existentes
- **SC-003**: La validación de slug duplicado funciona en tiempo real o al guardar
- **SC-004**: Un producto no puede publicarse sin al menos una imagen (validación enforced)
- **SC-005**: La eliminación de un producto vinculado a conjuntos muestra una advertencia y requiere desvinculación
- **SC-006**: La tabla de productos carga en < 1 segundo incluso con 100+ productos
- **SC-007**: El slug generado automáticamente es válido y único (no caracteres especiales)
- **SC-008**: El admin no puede crear dos productos con el mismo slug
