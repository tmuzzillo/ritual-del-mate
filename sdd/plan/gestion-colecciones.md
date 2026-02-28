# Plan de Ejecución: Gestión de Colecciones

**Fecha**: 2026-02-28
**Feature**: Gestión de colecciones (Admin)
**Especificación**: `/sdd/specs/gestion-colecciones.md`

---

## Dependencias

- ✓ Tabla `products` (ya existe)
- ✓ Tabla `sets` (ya existe)
- ✓ Tablas `collections`, `collection_products`, `collection_sets` (creadas en migración Fase 0)
- Autenticación admin (Supabase Auth con rol admin)
- Componentes shadcn/ui disponibles

---

## Base de Datos

**No se requieren nuevas migraciones**. Las tablas ya existen según Fase 0:

```sql
collections
  ├─ id (UUID PK)
  ├─ name (TEXT)
  ├─ slug (TEXT UNIQUE)
  ├─ description (TEXT nullable)
  ├─ images (TEXT[] default '{}')
  ├─ is_active (BOOLEAN default false)
  └─ created_at (TIMESTAMPTZ)

collection_products (junction)
  ├─ collection_id (UUID FK → collections)
  └─ product_id (UUID FK → products)

collection_sets (junction)
  ├─ collection_id (UUID FK → collections)
  └─ set_id (UUID FK → sets)
```

**Notas**:
- Eliminar colección elimina entradas en junction tables (CASCADE), NO los productos/sets
- Un producto o set puede pertenecer a múltiples colecciones (many-to-many)
- Slug debe ser único; validar en aplicación y base de datos

---

## API Routes

### 1. `GET /api/collections` (Público)
**Propósito**: Obtener todas las colecciones activas con sus productos y sets

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Colección Otoño",
    "slug": "coleccion-otono",
    "description": "...",
    "images": ["url1", "url2"],
    "is_active": true,
    "products": [{ "id": "uuid", "name": "...", "slug": "...", "price": 0 }],
    "sets": [{ "id": "uuid", "name": "...", "slug": "...", "price": 0 }]
  }
]
```

**Implementación**:
- Filtrar `is_active = true`
- JOIN con `collection_products` y `collection_sets`
- Incluir campos básicos de productos/sets (id, name, slug, price, is_active)
- Ordenar por `created_at DESC`

---

### 2. `POST /api/collections` (Admin)
**Propósito**: Crear nueva colección

**Auth**: Solo admin (middleware Supabase)

**Request body**:
```json
{
  "name": "string",
  "slug": "string",
  "description": "string nullable",
  "images": ["string"],
  "is_active": false,
  "productIds": ["uuid"],
  "setIds": ["uuid"]
}
```

**Validaciones**:
- Slug único (verificar existencia en tabla)
- Si `is_active: true`, requerido al menos 1 producto o set
- Slug válido (lowercase, sin espacios, solo letras/números/guiones)

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "name": "...",
  "slug": "...",
  "created_at": "2026-02-28T..."
}
```

**Implementación**:
- Insertar colección en `collections`
- Insertar filas en `collection_products` para cada producto
- Insertar filas en `collection_sets` para cada set
- Usar transacción para atomicidad

---

### 3. `GET /api/collections/[slug]` (Público)
**Propósito**: Obtener colección por slug (solo si activa)

**Response**: Misma estructura que GET /api/collections (una colección)

**Status**: 404 si no existe o no está activa

---

### 4. `PUT /api/collections/[id]` (Admin)
**Propósito**: Actualizar colección existente

**Auth**: Solo admin

**Request body**: Igual a POST (todos los campos opcionales)

**Validaciones**:
- Slug único (excepto el slug actual de la colección)
- Si `is_active: true`, requerido al menos 1 producto o set
- Colección debe existir

**Implementación**:
- Actualizar campos en `collections`
- **Reemplazar** filas en `collection_products`: DELETE antiguos, INSERT nuevos
- **Reemplazar** filas en `collection_sets`: DELETE antiguos, INSERT nuevos
- Usar transacción

---

### 5. `DELETE /api/collections/[id]` (Admin)
**Propósito**: Eliminar colección

**Auth**: Solo admin

**Validación**: Colección debe existir

**Implementación**:
- DELETE de `collections` con id (CASCADE elimina filas en junction tables)
- Productos/sets NO se eliminan

**Response**: `204 No Content`

---

## Admin UI: `app/admin/colecciones/page.tsx`

### Estructura de página
```
┌─────────────────────────────────────────┐
│ Gestión de Colecciones                  │
│ [+ Nueva Colección]                     │
├─────────────────────────────────────────┤
│ Tabla: Collections                      │
│  Nombre | Productos | Sets | Estado     │
│  [edit] [delete]                        │
└─────────────────────────────────────────┘
```

### Componentes a crear

#### 1. Tabla de Colecciones
**Archivo**: `app/admin/colecciones/components/CollectionsTable.tsx`

**Funcionalidad**:
- Columnas: Nombre, Productos (count), Sets (count), Estado (toggle), Acciones (edit/delete)
- Búsqueda por nombre (client-side filtering)
- Estado: badge verde (Activa) / gris (Inactiva)
- Botones: Editar (abre modal/form) + Eliminar (modal de confirmación)
- Carga inicial de todas las colecciones (GET /api/collections/admin)

---

#### 2. Form Modal: Crear/Editar Colección
**Archivo**: `app/admin/colecciones/components/CollectionForm.tsx`

**Campos**:
1. **Nombre** (required, text input)
2. **Slug** (required, text input, único, validación regex)
3. **Descripción** (optional, textarea)
4. **Imágenes** (optional, upload + preview, múltiples)
5. **Productos** (selector multi-select, searchable)
6. **Sets** (selector multi-select, searchable)
7. **Estado** (toggle: Activa/Inactiva)

**Validaciones**:
- Nombre: min 3 caracteres
- Slug: lowercase, sin espacios, único
- Si activa: requerido min 1 producto o set
- Imágenes: max 5MB cada una

**Submits**:
- Crear: POST /api/collections
- Editar: PUT /api/collections/[id]

---

#### 3. Selector de Productos
**Archivo**: `app/admin/colecciones/components/ProductSelector.tsx`

**Funcionalidad**:
- Búsqueda de productos por nombre
- Multi-select con checkboxes
- Mostrar: nombre, slug, precio (si aplica)
- Marcar productos inactivos con label "Inactivo" (color diferente, pero seleccionables)
- Precargar productos ya asociados (edit mode)

---

#### 4. Selector de Sets
**Archivo**: `app/admin/colecciones/components/SetSelector.tsx`

**Funcionalidad**:
- Idem ProductSelector pero para sets
- Búsqueda de sets por nombre
- Multi-select con checkboxes

---

#### 5. Modal de Confirmación de Eliminación
**Archivo**: `app/admin/colecciones/components/DeleteConfirmDialog.tsx`

**Funcionalidad**:
- Muestra nombre de colección a eliminar
- Advierte que productos/sets NO serán eliminados
- Botones: "Cancelar" + "Eliminar" (rojo)
- Ejecuta DELETE /api/collections/[id]

---

### Flujo de Interacción

**Crear colección**:
1. Admin click "+ Nueva Colección"
2. Modal abre con form vacío
3. Completa campos, selecciona productos/sets
4. Submit POST /api/collections
5. Modal cierra, tabla se recarga

**Editar colección**:
1. Admin click icono "Editar" en tabla
2. Modal abre con datos precargados
3. Modifica campos necesarios
4. Submit PUT /api/collections/[id]
5. Modal cierra, tabla se recarga

**Eliminar colección**:
1. Admin click icono "Eliminar" en tabla
2. Modal de confirmación aparece
3. Confirma o cancela
4. Si confirma, DELETE /api/collections/[id]
5. Tabla se recarga

---

## Carga de Imágenes

**Almacenamiento**: Supabase Storage
**Path**: `collections/<collection-id>/<filename>`

**Implementación**:
- Crear bucket público `collections` (si no existe)
- En form, permitir upload múltiple
- Tras crear colección, subir archivos a Storage con `PUT`
- Guardar URLs en campo `images` de `collections`
- En edición, permitir agregar/eliminar imágenes
- Eliminar archivos en Storage si se remueven de la colección

**Función auxiliar**: `lib/supabase/storage.ts`
```typescript
export async function uploadCollectionImage(
  collectionId: string,
  file: File
): Promise<string>

export async function deleteCollectionImage(
  collectionId: string,
  filename: string
): Promise<void>
```

---

## Integración con Navegación Admin

**Archivo**: `app/admin/layout.tsx` o `components/AdminNav.tsx`

**Acción**: Agregar enlace en sidebar/nav:
```
Gestión
├─ Productos
├─ Sets
├─ Colecciones  ← NUEVO
└─ ...
```

---

## Orden de Implementación (Fases)

### Fase 1: Backend - API Routes
1. `POST /api/collections` (crear)
2. `GET /api/collections` (público, list activas)
3. `GET /api/collections/[slug]` (público, detalle)
4. Tests: 85% coverage

### Fase 2: Backend - API Routes (cont.)
5. `PUT /api/collections/[id]` (editar)
6. `DELETE /api/collections/[id]` (eliminar)
7. Tests: 85% coverage

### Fase 3: Frontend - Componentes básicos
8. CollectionsTable component
9. ProductSelector component
10. SetSelector component
11. DeleteConfirmDialog component

### Fase 4: Frontend - Form y Page
12. CollectionForm component (crear/editar modal)
13. `app/admin/colecciones/page.tsx` (main page)
14. Integración con AdminNav

### Fase 5: Validación y Polish
15. Validaciones client/server
16. Manejo de errores y edge cases
17. Tests E2E
18. 85% coverage total

### Fase 6: Almacenamiento de imágenes
19. Funciones de upload/delete en Storage
20. Integración en CollectionForm
21. Tests

---

## Criterios de Aceptación

- ✓ Admin puede crear colección con productos/sets en < 60 segundos
- ✓ 100% de slugs únicos y válidos
- ✓ Edición persiste todos los cambios sin pérdida de datos
- ✓ Remover producto de colección NO elimina el producto
- ✓ Colecciones inactivas NO aparecen en `/colecciones` pública
- ✓ Tabla renderiza 50+ colecciones sin lag
- ✓ Código con 85%+ test coverage

---

## Deferred (Out of Scope)

- Población automática/basada en reglas
- Reordenamiento de items dentro de colección
- Analíticas (vistas, clics)
- Asignación masiva
- Historial de cambios/auditoría
- Exportación de datos
