# Feature Specification: Gestión de Categorías (Admin)

**Created**: 2026-02-28

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear Nueva Categoría (Priority: P1)
El administrador crea una nueva categoría especificando un nombre. El slug se genera automáticamente a partir del nombre (conversión a minúsculas, reemplazo de espacios por guiones).

**Why this priority**: Funcionalidad crítica para estructurar el catálogo de productos desde el inicio.

**Independent Test**: Verificar que se puede crear una categoría con nombre válido y que el slug se genera correctamente.

**Acceptance Scenarios**:
1. **Scenario**: Crear categoría con nombre simple
   - **Given** el administrador está en `/admin/categorias`
   - **When** completa el formulario con nombre "Bombillas" y envía
   - **Then** la categoría se crea exitosamente, el slug es "bombillas" y aparece en la lista

2. **Scenario**: Crear categoría con nombre con espacios
   - **Given** el administrador está en `/admin/categorias`
   - **When** completa el formulario con nombre "Accesorios de Viaje" y envía
   - **Then** la categoría se crea con slug "accesorios-de-viaje"

3. **Scenario**: Intentar crear categoría con nombre vacío
   - **Given** el administrador está en `/admin/categorias`
   - **When** intenta enviar el formulario sin nombre
   - **Then** aparece un mensaje de error indicando que el nombre es obligatorio

4. **Scenario**: Intentar crear categoría con nombre duplicado
   - **Given** existe una categoría llamada "Bombillas"
   - **When** el administrador intenta crear otra con el mismo nombre
   - **Then** aparece un error indicando que el nombre ya existe

---

### User Story 2 - Editar Categoría Existente (Priority: P2)
El administrador puede modificar el nombre y/o slug de una categoría existente.

**Why this priority**: Necesario para corregir errores o ajustar nombres después de la creación inicial.

**Independent Test**: Verificar que se pueden editar nombre y slug de una categoría sin afectar productos asignados.

**Acceptance Scenarios**:
1. **Scenario**: Editar nombre de categoría
   - **Given** existe una categoría "Bombilla"
   - **When** el administrador abre la categoría y cambia el nombre a "Bombillas Tradicionales"
   - **Then** la categoría se actualiza con el nuevo nombre

2. **Scenario**: Editar slug de categoría
   - **Given** existe una categoría con slug "accesorios-viaje"
   - **When** el administrador cambia el slug a "kit-viaje"
   - **Then** el slug se actualiza exitosamente

3. **Scenario**: Intentar editar a nombre duplicado
   - **Given** existen categorías "Bombillas" y "Vasos"
   - **When** el administrador intenta cambiar "Vasos" por "Bombillas"
   - **Then** aparece un error indicando que el nombre ya existe

4. **Scenario**: Editar slug con caracteres inválidos
   - **Given** el administrador está editando una categoría
   - **When** intenta ingresar un slug con caracteres especiales o mayúsculas
   - **Then** aparece un error validando que solo permite minúsculas, números y guiones

---

### User Story 3 - Eliminar Categoría (Priority: P3)
El administrador puede eliminar una categoría. Si la categoría tiene productos asociados, se muestra una advertencia y los productos quedan sin categoría (categoria_id = null).

**Why this priority**: Importante para mantener el catálogo limpio, pero secundario respecto a creación y edición.

**Independent Test**: Verificar que la eliminación es segura y que los productos no se pierden cuando se elimina su categoría.

**Acceptance Scenarios**:
1. **Scenario**: Eliminar categoría sin productos
   - **Given** existe una categoría vacía llamada "Categoría Test"
   - **When** el administrador selecciona eliminar y confirma
   - **Then** la categoría se elimina y ya no aparece en la lista

2. **Scenario**: Eliminar categoría con productos (mostrar advertencia)
   - **Given** existe una categoría "Bombillas" con 5 productos asociados
   - **When** el administrador selecciona eliminar
   - **Then** aparece un diálogo de confirmación indicando "Esta categoría tiene 5 productos. Al eliminarla, estos productos quedarán sin categoría"

3. **Scenario**: Confirmar eliminación de categoría con productos
   - **Given** el diálogo de confirmación está abierto para una categoría con 5 productos
   - **When** el administrador hace clic en "Confirmar eliminación"
   - **Then** la categoría se elimina y los 5 productos ahora tienen categoria_id = null

4. **Scenario**: Cancelar eliminación
   - **Given** el diálogo de confirmación está abierto
   - **When** el administrador hace clic en "Cancelar"
   - **Then** la categoría no se elimina y el diálogo se cierra

---

### User Story 4 - Ver Lista de Categorías (Priority: P4)
El administrador visualiza todas las categorías en una tabla mostrando: nombre, slug y cantidad de productos usando esa categoría.

**Why this priority**: Funcionalidad de visualización; debe completarse después de las funciones de CRUD.

**Independent Test**: Verificar que la tabla muestra correctamente todos los datos y se actualiza al crear/editar/eliminar categorías.

**Acceptance Scenarios**:
1. **Scenario**: Ver tabla de categorías vacía
   - **Given** no existen categorías en el sistema
   - **When** el administrador accede a `/admin/categorias`
   - **Then** aparece una tabla vacía con mensaje "No hay categorías"

2. **Scenario**: Ver tabla con categorías
   - **Given** existen 3 categorías: "Bombillas" (2 productos), "Vasos" (3 productos), "Accesorios" (0 productos)
   - **When** el administrador accede a `/admin/categorias`
   - **Then** la tabla muestra las 3 categorías con sus conteos correctos

3. **Scenario**: Actualizar conteo de productos al crear producto
   - **Given** la categoría "Bombillas" muestra 2 productos en la tabla
   - **When** el administrador crea un nuevo producto y lo asigna a "Bombillas"
   - **Then** el conteo en la tabla se actualiza a 3

4. **Scenario**: Actualizar conteo al desasignar producto de categoría
   - **Given** la categoría "Bombillas" muestra 2 productos
   - **When** el administrador edita un producto y lo cambia a otra categoría
   - **Then** el conteo de "Bombillas" se actualiza a 1

---

### Edge Cases
- Slug debe contener solo letras minúsculas, números y guiones: validar antes de guardar
- Intentar crear categoría con nombre que ya existe (case-insensitive): rechazar con error
- Eliminar categoría cuya última referencia es un producto en borrador: producto queda sin categoría
- Slug auto-generado de nombre con múltiples espacios consecutivos: convertir a un solo guión
- Slug auto-generado de nombre con caracteres especiales (ñ, á, é, etc.): convertir a sus equivalentes ASCII (n, a, e)
- Editar slug manualmente a un valor que ya existe: rechazar con error

## Out of Scope
- Subcategorías o categorías jerárquicas
- Imágenes o descripciones para categorías
- Reordenamiento manual de categorías
- Activación/desactivación de categorías sin eliminarlas
- Merging o combinación de categorías

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: El administrador puede crear una categoría proporcionando un nombre
- **FR-002**: El slug se genera automáticamente a partir del nombre (conversión a minúsculas, espacios → guiones)
- **FR-003**: El administrador puede editar el nombre y slug de una categoría existente
- **FR-004**: El administrador puede eliminar una categoría con confirmación
- **FR-005**: Al eliminar una categoría con productos, estos productos quedan con categoria_id = null (no se eliminan)
- **FR-006**: El nombre y slug deben ser únicos en el sistema
- **FR-007**: El nombre no puede estar vacío
- **FR-008**: El slug solo puede contener letras minúsculas, números y guiones
- **FR-009**: El administrador visualiza todas las categorías en una tabla con nombre, slug y conteo de productos

### Key Entities
- **Category**: { id, name, slug, created_at }
  - `name` (string, unique, not null): Nombre de la categoría
  - `slug` (string, unique, not null): Identificador URL-safe de la categoría
  - `id` (uuid, pk): Identificador único
  - `created_at` (timestamp): Fecha de creación

- **Product**: { id, name, slug, category_id, ... }
  - `category_id` (uuid, fk a Category, nullable): Referencia a la categoría; puede ser null si el producto no tiene categoría

- **MateSet**: { id, name, slug, category_id, ... }
  - `category_id` (uuid, fk a Category, nullable): Los sets también tienen categoría, permitiendo navegar y filtrar sets de la misma forma que productos

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 100% de los user stories P1 y P2 implementados y funcionando
- **SC-002**: Todas las validaciones (nombre/slug únicos, caracteres válidos) funcionan correctamente
- **SC-003**: La tabla de categorías se actualiza automáticamente al crear/editar/eliminar
- **SC-004**: Ningún producto se elimina al eliminar su categoría; todos quedan con categoria_id = null
- **SC-005**: Cobertura de código >= 85% en la funcionalidad de gestión de categorías
- **SC-006**: La interfaz de usuario es clara y muestra mensajes de error/éxito apropiados
