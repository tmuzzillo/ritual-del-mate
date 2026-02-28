# Plan de Ejecución: Gestión de Categorías (Admin)

**Fecha**: 2026-02-28
**Status**: Planificado
**Prioridad**: P1 (User Stories P1 + P2)

---

## Dependencias

### Pre-requisitos de Infraestructura
- **Supabase**: Proyecto configurado y conectado en `lib/supabase/server.ts`
- **Autenticación**: Sistema de sesiones admin implementado (ya existe)
- **shadcn/ui**: Componentes disponibles (`Table`, `Dialog`, `Button`, `Form`, `Input`, `Badge`)

### Dependencias de Código
- Validación con **zod** (ya está en package.json)
- Formularios con **react-hook-form** (ya está en package.json)
- Notificaciones con **sonner** (ya está en package.json)
- Iconos de **lucide-react** (ya está en package.json)

### Estados del Proyecto
- No depende de otras features (es independiente)
- Compatible con sistema de productos (relación FK `products.category_id` y `mate_sets.category_id`)

---

## Base de Datos

### Migración a Crear
**Archivo**: `migrations/[timestamp]_create_categories_table.sql`

```sql
-- Crear tabla categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para búsquedas frecuentes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_name ON categories(name);

-- Agregar constraint de formato para slug (solo minúsculas, números y guiones)
ALTER TABLE categories ADD CONSTRAINT check_slug_format
  CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
```

### Relaciones Afectadas (Migración Futura)
- `products.category_id` → `categories.id` (FK, ON DELETE SET NULL)
- `mate_sets.category_id` → `categories.id` (FK, ON DELETE SET NULL)

**Nota**: Las migraciones de relaciones con productos y mate_sets son out of scope; se definirán en sus features correspondientes.

---

## API Routes

### GET `/api/categories` (Público)
- **Método**: GET
- **Autenticación**: No requerida (lectura pública)
- **Descripción**: Obtener lista de todas las categorías
- **Response**: `{ data: Category[] }` donde `Category = { id, name, slug, created_at }`
- **Comportamiento**: Retorna categorías ordenadas por `created_at` DESC

### POST `/api/categories` (Admin)
- **Método**: POST
- **Autenticación**: Requerida (solo admin)
- **Descripción**: Crear nueva categoría
- **Body**: `{ name: string, slug?: string }`
  - Si `slug` no se proporciona, se genera automáticamente del `name`
  - Si `slug` se proporciona, valida formato y unicidad
- **Validación**:
  - `name`: no vacío, no duplicado (case-insensitive), max 255 chars
  - `slug`: solo minúsculas, números y guiones; no duplicado; max 255 chars
- **Response (201)**: `{ data: Category }`
- **Response (400)**: `{ error: string }` (validación fallida)
- **Response (409)**: `{ error: string }` (nombre o slug duplicado)

### PUT `/api/categories/[id]` (Admin)
- **Método**: PUT
- **Autenticación**: Requerida (solo admin)
- **Descripción**: Actualizar nombre y/o slug de categoría existente
- **Body**: `{ name?: string, slug?: string }` (al menos uno debe ser provided)
- **Validación**: Mismas reglas que POST
- **Response (200)**: `{ data: Category }`
- **Response (400)**: `{ error: string }` (validación fallida)
- **Response (404)**: `{ error: string }` (categoría no existe)
- **Response (409)**: `{ error: string }` (nombre o slug duplicado)

### DELETE `/api/categories/[id]` (Admin)
- **Método**: DELETE
- **Autenticación**: Requerida (solo admin)
- **Descripción**: Eliminar categoría. Los productos asociados quedan con `category_id = null`
- **Response (200)**: `{ data: { id: string, productCount: number } }` (productCount = cuántos productos quedan sin categoría)
- **Response (404)**: `{ error: string }` (categoría no existe)
- **Comportamiento**: Ejecuta transacción para desasociar productos antes de eliminar

### GET `/api/categories/[id]` (Público)
- **Método**: GET
- **Autenticación**: No requerida
- **Descripción**: Obtener categoría específica por ID
- **Response (200)**: `{ data: Category }`
- **Response (404)**: `{ error: string }` (categoría no existe)

### GET `/api/categories/[id]/count` (Público)
- **Método**: GET
- **Autenticación**: No requerida
- **Descripción**: Obtener conteo de productos en categoría
- **Response (200)**: `{ data: { id: string, productCount: number } }`
- **Response (404)**: `{ error: string }` (categoría no existe)

### Implementación Técnica
- **Archivo existente a expandir**: `app/api/categories/route.ts`
  - Implementar GET y POST en este archivo
- **Archivo nuevo**: `app/api/categories/[id]/route.ts`
  - Implementar PUT y DELETE para un ID específico
  - GET y GET count opcionales pero recomendados

---

## Admin UI

### Estructura de Componentes

#### Página Principal: `app/admin/categorias/page.tsx`
- Layout con header "Categorías" y botón "Nueva Categoría"
- Integración de tabla y diálogos
- State management para refetch automático post-operación

#### Componente: `CategoryTable`
Ubicación: `components/admin/categories/category-table.tsx`

**Funcionalidades**:
- Tabla con columnas: Nombre | Slug | Productos | Acciones
- Carga inicial de categorías (GET `/api/categories`)
- Refetch automático después de crear/editar/eliminar
- Acciones por fila: Editar (ícono pencil) | Eliminar (ícono trash)
- Mensaje "No hay categorías" cuando lista vacía
- Skeleton loading mientras carga datos

**Detalles de Columnas**:
- **Nombre**: Texto simple
- **Slug**: Badge con `variant="secondary"` fondo gris
- **Productos**: Número en Badge color neutro (ej: `2 productos`)
- **Acciones**: Dos botones iconográficos (edit, delete) sin texto

#### Componente: `CreateCategoryDialog`
Ubicación: `components/admin/categories/create-category-dialog.tsx`

**Funcionalidades**:
- Diálogo (Dialog de shadcn/ui)
- Formulario con campos:
  - **Nombre**: Input text, obligatorio, placeholder "Ej: Bombillas"
  - **Slug Preview**: Input readonly, muestra slug generado automáticamente a partir del nombre
  - **Slug Manual**: Checkbox para activar edición manual del slug
    - Si activo: Input text editable con validación en tiempo real
    - Si inactivo: Input readonly (auto-generado)
- Botones: "Cancelar" | "Crear"
- Validaciones:
  - Nombre no vacío
  - Slug validado (solo minúsculas, números, guiones)
  - Mensajes de error inline bajo campos
- Post-submit: Llamar POST `/api/categories`
- Post-success: Cerrar diálogo, refetch lista, toast "Categoría creada"
- Post-error: Mostrar error en toast y permitir reintentar

#### Componente: `EditCategoryDialog`
Ubicación: `components/admin/categories/edit-category-dialog.tsx`

**Funcionalidades**:
- Similar a CreateCategoryDialog pero pre-populate con datos existentes
- Mismo layout de formulario
- Botones: "Cancelar" | "Guardar Cambios"
- Validaciones: Mismas que create
- Post-submit: Llamar PUT `/api/categories/[id]`
- Post-success: Cerrar diálogo, refetch lista, toast "Categoría actualizada"
- Post-error: Mostrar error específico (ej: nombre duplicado, slug duplicado)

#### Componente: `DeleteCategoryConfirmDialog`
Ubicación: `components/admin/categories/delete-category-confirm-dialog.tsx`

**Funcionalidades**:
- Diálogo de confirmación
- Mensaje descriptivo:
  - Si no tiene productos: "¿Eliminar categoría '[nombre]'? Esta acción no se puede deshacer."
  - Si tiene productos: "¿Eliminar categoría '[nombre]'? Tiene **[N] productos** asociados. Al eliminarla, estos productos quedarán sin categoría."
- Badge rojo con número de productos (solo si > 0)
- Botones: "Cancelar" | "Confirmar Eliminación" (rojo/destructivo)
- Post-confirm: Llamar DELETE `/api/categories/[id]`
- Post-success: Cerrar diálogo, refetch lista, toast "Categoría eliminada"
- Post-error: Mostrar error en toast

### Implementación Detallada

#### Paso 1: Estructura de Directorios
```
components/
└── admin/
    └── categories/
        ├── category-table.tsx
        ├── create-category-dialog.tsx
        ├── edit-category-dialog.tsx
        └── delete-category-confirm-dialog.tsx
```

#### Paso 2: Validación y Esquemas (zod)
Crear: `lib/schemas/category.schema.ts`
- `CreateCategorySchema`: { name: string (min 1, max 255), slug?: string }
- `UpdateCategorySchema`: { name?: string (min 1, max 255), slug?: string } (al menos uno required)
- `SlugSchema`: Validación formato slug

#### Paso 3: Utilidades
Crear: `lib/utils/slug.ts`
- Función `generateSlug(name: string): string`

#### Paso 4: Hooks de Datos
Crear: `lib/hooks/use-categories.ts`
- `useCategories()`: Fetch categorías con refetch
- `useCategoryMutation()`: Hook para create/update/delete (TBD: usar react-query o native fetch)

#### Paso 5: Integración en Página
`app/admin/categorias/page.tsx`:
```typescript
- Import CategoryTable, CreateCategoryDialog
- State: categories[], loading, error
- Effect: Fetch categorías en mount
- Render: Header + Button crear + CategoryTable
- Diálogos: CreateCategoryDialog, EditCategoryDialog, DeleteCategoryConfirmDialog (controlados por state)
```

#### Paso 6: Estilos
- Usar clases Tailwind de Tailwind v4
- Componentes shadcn/ui (Button, Dialog, Table, Form, Input, Badge)
- Validación visual: bordes rojos en inputs con error
- Estados: disabled en botones durante submit

---

## Slug Generation

### Función: `generateSlug(name: string): string`

**Ubicación**: `lib/utils/slug.ts`

**Lógica**:
1. Convertir a minúsculas
2. Normalizar caracteres acentuados (ñ→n, á→a, é→e, etc.) usando `String.prototype.normalize('NFD')`
3. Reemplazar espacios por guiones
4. Remover caracteres especiales (mantener solo a-z, 0-9, guiones)
5. Remover guiones múltiples consecutivos → un solo guión
6. Remover guiones al inicio y final
7. Validar que resultado sea válido (no vacío, no solo guiones)

**Ejemplo**:
```
"Accesorios de Viaje" → "accesorios-de-viaje"
"Bombilla Ñoño" → "bombilla-nono"
"Kit --- Viaje" → "kit-viaje"
"   espacios   " → "espacios"
```

**Validación**:
- Patrón regex: `^[a-z0-9]+(-[a-z0-9]+)*$`
- Máx 255 caracteres

**Exports**:
- `generateSlug(name: string): string`
- `isValidSlug(slug: string): boolean`

---

## Deferred (Out of Scope)

### No Implementado en Esta Feature
1. **Subcategorías**: No hay soporte para categorías jerárquicas (parent_id)
2. **Imágenes/Descripciones**: Las categorías solo tienen `name`, `slug`, `created_at`
3. **Reordenamiento**: No hay campo `order` ni UI para drag-and-drop
4. **Activación/Desactivación**: No hay `is_active` flag; se elimina o existe
5. **Merging de Categorías**: No hay operación para combinar dos categorías
6. **Búsqueda/Filtrado**: La tabla muestra todas; sin search box (implementar en future story)
7. **Paginación**: Si hay muchas categorías, mostrar todas sin paginar (implementar en future story)
8. **Exportación**: No hay CSV/Excel export
9. **Bulk Operations**: No hay delete/edit múltiple simultáneamente
10. **Historial**: No hay auditoría de cambios (quién creó, cuándo editó, etc.)

### Por Implementar Posteriormente
- **Relaciones Product ↔ Category**: Aunque la spec menciona conteo de productos, la tabla `products` se crea en otra feature
- **Relaciones MateSet ↔ Category**: Igual que productos, en feature separada
- **Permisos Granulares**: Admin actual es booleano; granularidad futura
- **Analytics**: Gráficos de productos por categoría

---

## Criterios de Aceptación del Plan

1. **Migración DB**: Tabla `categories` creada con validaciones en BD
2. **API Routes**: Todos los endpoints GET/POST/PUT/DELETE funcionan con autenticación correcta
3. **UI Admin**: Página lista de categorías con CRUD completo
4. **Slug Generation**: Auto-generación y validación manual funcionan
5. **Validaciones**: Duplicados detectados, formato slug validado, errores mostrados en UI
6. **Refetch Automático**: Post-operación, lista se actualiza sin reload manual
7. **Conteo de Productos**: Tabla muestra conteo (0 si aún no hay products table)
8. **Toasts**: Feedback visual post-acción (éxito/error)
9. **Cobertura**: >= 85% en tests de API y componentes
10. **User Stories**: P1 (crear) y P2 (editar) 100% completadas

---

## Estimación

| Fase | Tarea | Horas Est. |
|------|-------|-----------|
| **DB** | Crear migración | 0.5 |
| **API** | Implementar GET + POST en `/categories` | 2 |
| **API** | Implementar PUT + DELETE en `/categories/[id]` | 2 |
| **Utils** | Slug generator + schemas | 1 |
| **UI** | CategoryTable component | 2 |
| **UI** | CreateCategoryDialog | 2 |
| **UI** | EditCategoryDialog | 1.5 |
| **UI** | DeleteCategoryConfirmDialog | 1 |
| **UI** | Integración en página principal | 1.5 |
| **Testing** | Tests API (unit + integration) | 2.5 |
| **Testing** | Tests componentes (unit + snapshot) | 2 |
| **Code Review** | Review y ajustes | 1 |
| **Total** | | **18.5 horas** |

---

## Dependencias Entre Tareas

```
[DB Migration]
    ↓
[API Routes] → [Utils: Slug Generator]
    ↓
[Schemas (Zod)]
    ↓
[UI Components] ← [Hooks: useCategories]
    ↓
[Page Integration]
    ↓
[Testing] → [Code Review]
```

**Camino Crítico**: DB → API → UI Components → Page Integration → Testing
**Paralelizable**: API + Utils + Schemas + UI Components (con mocks)

---

## Notas Técnicas

1. **Auth**: Usar `createClient()` de `lib/supabase/server.ts` en API routes para verificar sesión admin
2. **Naming**: Todos los archivos en minúsculas con guiones (`category-table.tsx`, no `CategoryTable.tsx`)
3. **Types**: Crear `types/category.ts` con tipo `Category` reutilizable en API + UI
4. **Error Handling**: Mensajes claros en ES para el usuario (no stack traces)
5. **Loading States**: UI deshabilitada durante llamadas async; spinners en tabla
6. **Refetch Strategy**: Post-operación llamar GET `/api/categories` nuevamente (SWR o react-query)
7. **Database Transactions**: DELETE incluye transacción para SET NULL en products (future)
