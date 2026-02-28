# Plan de Ejecución: Gestión de Sets (Admin)

**Fecha**: 2026-02-28
**Modelo**: Haiku 4.5
**Status**: En Planificación

---

## 1. Dependencias

### Prerequisitos
- ✅ Tablas `sets` y `set_items` creadas en Fase 0
- ✅ Tabla `products` con at least 1 producto activo para testing
- ✅ Tabla `categories` con at least 1 categoría activa
- ✅ Sistema de autenticación admin functional
- ✅ Supabase Storage bucket `sets` creado para imágenes

### Validación Pre-Desarrollo
Ejecutar query para verificar estructura:
```sql
-- Verificar tablas existen
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('sets', 'set_items', 'products', 'categories');

-- Verificar al menos 1 producto y 1 categoría activos
SELECT COUNT(*) FROM products WHERE is_active = true;
SELECT COUNT(*) FROM categories WHERE is_active = true;
```

---

## 2. Base de Datos

### Índices (sin migración nueva)

Crear índices para optimizar queries frecuentes en `public/migrations`:

```sql
-- Índice para búsquedas por slug (GET /api/sets/[id])
CREATE INDEX IF NOT EXISTS idx_sets_slug ON sets(slug);

-- Índice para queries de sets activos (GET /api/sets)
CREATE INDEX IF NOT EXISTS idx_sets_is_active ON sets(is_active);

-- Índice para join set_items -> products
CREATE INDEX IF NOT EXISTS idx_set_items_set_id ON set_items(set_id);
CREATE INDEX IF NOT EXISTS idx_set_items_product_id ON set_items(product_id);

-- Índice para búsqueda por categoría
CREATE INDEX IF NOT EXISTS idx_sets_category_id ON sets(category_id);
```

### Validación de Integridad
- `sets.slug`: UNIQUE constraint (generado automáticamente, resuelve duplicados con sufijo numérico)
- `set_items.set_id`: Foreign key → `sets.id` ON DELETE CASCADE
- `set_items.product_id`: Foreign key → `products.id` (sin cascade)
- `sets.category_id`: Foreign key → `categories.id` ON DELETE SET NULL (opcional)

---

## 3. API Routes

### `GET /api/sets`
**Visibilidad**: Público
**Descripción**: Lista todos los sets activos con sus detalles completos.

**Response (200)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Set Premium",
      "slug": "set-premium",
      "description": "...",
      "price": 99.99,
      "images": ["url1", "url2"],
      "category_id": "uuid",
      "category": { "id": "uuid", "name": "..." },
      "is_active": true,
      "set_items": [
        {
          "id": "uuid",
          "quantity": 2,
          "product": {
            "id": "uuid",
            "name": "Mate",
            "price": 50,
            "is_active": true
          }
        }
      ],
      "created_at": "2026-02-28T..."
    }
  ]
}
```

**Filtros**: Solo sets donde `is_active = true`

---

### `POST /api/sets`
**Visibilidad**: Admin only
**Descripción**: Crea un nuevo set con productos asociados.

**Request Body**:
```json
{
  "name": "Set Premium",
  "description": "...",
  "price": 99.99,
  "category_id": "uuid|null",
  "images": ["url1", "url2"],
  "is_active": false,
  "set_items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ]
}
```

**Validaciones**:
- `name`: 1-255 caracteres, required
- `price`: > 0, required
- `set_items`: array, puede estar vacío (draft)
- Slug: generado automáticamente, resolver duplicados con sufijo numérico

**Logic**:
1. Generar slug desde name (auto-resolución de duplicados)
2. Crear set en `sets`
3. Crear registros en `set_items` para cada producto
4. Retornar set con relaciones pobladas

**Response (201)**:
```json
{
  "data": {
    "id": "uuid",
    "name": "...",
    "slug": "...",
    ...
  }
}
```

---

### `GET /api/sets/[id]`
**Visibilidad**: Público
**Descripción**: Obtiene detalles de un set específico.

**Response (200)**:
```json
{
  "data": { /* same structure as GET /api/sets item */ }
}
```

**Errores**:
- 404 si set no existe
- 403 si set no está activo (para públicos; admin puede ver inactivos)

---

### `PUT /api/sets/[id]`
**Visibilidad**: Admin only
**Descripción**: Actualiza campos del set y reemplaza completamente los set_items.

**Request Body**:
```json
{
  "name": "Set Premium Updated",
  "description": "...",
  "price": 109.99,
  "category_id": "uuid|null",
  "images": ["url1"],
  "is_active": true,
  "set_items": [
    {
      "product_id": "uuid",
      "quantity": 3
    }
  ]
}
```

**Validaciones**:
- Si `is_active = true` Y `set_items` está vacío → error 400 "Set debe tener al menos 1 producto para activarlo"
- Slug: validar uniqueness si `name` cambió
- No permitir cambios de `id` o `created_at`

**Logic**:
1. Validar set existe
2. Actualizar campos en `sets`
3. Eliminar todos los `set_items` del set actual
4. Crear nuevos `set_items`
5. Retornar set actualizado

**Response (200)**:
```json
{
  "data": { /* updated set */ }
}
```

---

### `DELETE /api/sets/[id]`
**Visibilidad**: Admin only
**Descripción**: Elimina set de forma permanente. Los productos NO se eliminan.

**Validaciones**:
- Validar set existe

**Logic**:
1. Eliminar registro en `sets` (CASCADE elimina `set_items` automáticamente)
2. Productos siguen existiendo

**Response (204)**: Sin contenido

**Errores**:
- 404 si set no existe

---

## 4. Admin UI: `/app/admin/sets/page.tsx`

### 4.1 Estructura General

```
/app/admin/sets/
├── page.tsx          (Página principal)
├── layout.tsx        (Opcional)
└── components/
    ├── SetsTable.tsx        (Tabla de listado)
    ├── SetForm.tsx          (Formulario crear/editar)
    ├── ProductSelector.tsx  (Selector de productos + cantidad)
    ├── ImageUploader.tsx    (Carga de imágenes)
    └── DeleteDialog.tsx     (Confirmación de eliminación)
```

### 4.2 Tabla de Sets (SetsTable)

**Columnas**:
1. **Nombre**: Clickeable para editar
2. **Precio**: Formato moneda
3. **Categoría**: Nombre de categoría (si existe)
4. **Items**: Cantidad de productos (ej: "3 items")
5. **Estado**: Badge visual (activo=green, inactivo=gray)
6. **Acciones**: Editar, Duplicar (opcional), Eliminar

**Funcionalidades**:
- Carga inicial: GET `/api/sets` (retorna solo activos) + query manual para inactivos
- Botón "+ Nuevo Set" en header → abre SetForm en modo create
- Cada fila clickeable → abre SetForm en modo edit
- Eliminación: click en icono → muestra DeleteDialog
- Badge de estado clickeable: toggle activo/inactivo (PATCH con solo `is_active`)
- Tabla vacía: mensaje "No hay sets creados" + botón "+ Nuevo"

**UI Framework**:
- shadcn/ui DataTable o composición manual con `<Table>` + `<Th>` + `<Td>`
- Responsive: columna acciones puede colapsarse en mobile

---

### 4.3 Formulario de Set (SetForm)

**Modo Create** (modal/drawer):
- Abre al clickear "+ Nuevo Set"
- Todos los campos vacíos
- Botones: "Crear", "Cancelar"

**Modo Edit** (modal/drawer):
- Abre al clickear en fila de tabla
- Precarga datos del set
- Botones: "Guardar", "Cancelar"

**Campos**:

#### 3.3.1 Información Básica
- **Nombre** (text input)
  - Validación: 1-255 chars, required
  - onChange: actualizar preview del slug en tiempo real
- **Slug** (text input, read-only)
  - Mostrado pero no editable (generado automáticamente)
  - Puede ser opcional permitir override en edge cases

#### 3.3.2 Descripción
- **Descripción** (textarea)
  - Validación: 0-1000 chars, optional

#### 3.3.3 Precios y Categoría
- **Precio** (number input)
  - Validación: > 0, required, 2 decimales
- **Categoría** (select/combobox)
  - Carga categorías activas desde API o DB
  - Optional (null permitido)
  - Muestra nombre + (opcional) thumbnail

#### 3.3.4 Imágenes (ImageUploader)
- Carga múltiples imágenes a Supabase Storage
- Path: `sets/<set-id>/<filename>`
- Mostrar preview en miniatura
- Botón "x" para remover cada imagen
- Máximo 5 imágenes (configurable)
- Validación: tipos JPEG/PNG/WebP, <5MB cada una

#### 3.3.5 Productos (ProductSelector)
- Componente dedicado (ver 4.4)
- Lista de productos agregados al set
- Cada item muestra: nombre, precio (unitario), cantidad, botón eliminar
- Validación: Si `is_active = true`, debe haber al least 1 producto

#### 3.3.6 Estado
- **Activo** (toggle/checkbox)
  - Label: "Publicar set"
  - Si toggle a `true` sin productos → mostrar toast error con mensaje claro

**Flujo de Guardado**:
1. Validar formulario completo (zod schema)
2. Si modo create:
   - POST `/api/sets` con datos + set_items
   - Retorna set con `id` generado
   - Upload de imágenes a `sets/<set-id>/*.jpg` (después de crear set)
   - PATCH `/api/sets/[id]` para actualizar `images` array
3. Si modo edit:
   - Validar cambios
   - PUT `/api/sets/[id]` con datos completos
   - Upload solo imágenes nuevas
4. En ambos: toast "Set guardado exitosamente"
5. Cerrar modal y refrescar tabla

---

### 4.4 Selector de Productos (ProductSelector)

**UI**:
- Input combobox para búsqueda de productos (debounced)
- Dropdown con coincidencias (name + price)
- Seleccionar producto → se agrega a tabla
- Tabla con: Nombre | Precio (unitario) | Cantidad | Acciones

**Lógica**:
1. Búsqueda: GET `/api/products?search=<query>&is_active=true` (o query local)
2. Al agregar producto:
   - Agregar a array `set_items` con `quantity: 1`
   - Si producto ya está en la lista → incrementar cantidad (opcional)
3. Tabla permite editar cantidad (number input, min 1)
4. Botón eliminar por cada item

**Validación**:
- Cantidad debe ser > 0
- No permitir duplicados (opcional: agregar mismo producto = incrementar cantidad)
- **Advertencia Visual**: Si un producto está inactivo (`is_active = false`)
  - Mostrar badge rojo "Inactivo"
  - Toast warning cuando se agrega producto inactivo
  - Mensaje: "Este producto está inactivo. Verificar disponibilidad antes de guardar."

---

### 4.5 Carga de Imágenes (ImageUploader)

**Flujo**:
1. Drag-and-drop o click para seleccionar archivos
2. Validaciones:
   - Tipos: JPEG, PNG, WebP
   - Tamaño: < 5MB
   - Máximo 5 imágenes
3. En creación: guardar archivos temporales en memoria / FormData
4. En guardado del set:
   - Crear set primero (obtener `id`)
   - Upload de imágenes con nombres: `<timestamp>-<random>.ext`
   - Path: `sets/<set-id>/<filename>`
   - Actualizar `images` array con URLs públicas
   - PATCH `/api/sets/[id]` con array de URLs
5. Preview: mostrar miniatura en grid
6. Remover: eliminar de lista (marcar para borrado si ya existe)

---

### 4.6 Diálogo de Eliminación (DeleteDialog)

**Trigger**:
- Click en icono eliminar en tabla o en modal de edición

**Contenido**:
```
Título: "Eliminar set"
Mensaje: "¿Estás seguro de que deseas eliminar '{set.name}'?
Los productos que lo integran NO serán eliminados."
Botones: [Cancelar] [Eliminar]
```

**Lógica**:
- Si confirm: DELETE `/api/sets/[id]`
- Toast: "Set eliminado"
- Refrescar tabla
- Cerrar modal

---

## 5. Validaciones y Reglas de Negocio

### Cliente (Frontend, zod schema)
```typescript
const SetFormSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  category_id: z.string().uuid().optional().nullable(),
  images: z.array(z.string().url()).max(5),
  is_active: z.boolean(),
  set_items: z.array(
    z.object({
      product_id: z.string().uuid(),
      quantity: z.number().int().positive()
    })
  ).min(0)
}).refine(
  (data) => !data.is_active || data.set_items.length > 0,
  {
    message: "Set debe tener al menos 1 producto para ser activado",
    path: ["is_active"]
  }
);
```

### Servidor (Backend, POST/PUT)
- Validar autenticación admin
- Validar estructura set_items
- Validar productos existen y están activos (warning, no error)
- Validar categoría existe (si se proporciona)
- Generar/resolver slug duplicado
- Si `is_active = true`, verificar `set_items.length > 0`

---

## 6. Carga de Imágenes (Supabase Storage)

### Configuración
- **Bucket**: `sets` (debe existir, visibilidad pública o autenticada según política)
- **Path**: `sets/<set-id>/<filename>`
- **Política de acceso**: Permitir reads públicos, writes solo para admin autenticado

### Implementación
```typescript
// Upload
const uploadImage = async (setId: string, file: File) => {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split('.').pop()}`;
  const { data, error } = await supabase.storage
    .from('sets')
    .upload(`${setId}/${filename}`, file);

  if (error) throw error;

  // Retornar URL pública
  const { data: publicUrl } = supabase.storage
    .from('sets')
    .getPublicUrl(`${setId}/${filename}`);

  return publicUrl.publicUrl;
};

// Eliminar
const deleteImage = async (setId: string, filename: string) => {
  await supabase.storage
    .from('sets')
    .remove([`${setId}/${filename}`]);
};
```

---

## 7. Testing & Acceptance Criteria

### Unit Tests (Modelos & Utilities)
- Slug generation: manejo de duplicados
- Validación de cantidad > 0
- Validación de set_items no vacío si is_active = true

### Integration Tests (API)
- POST /api/sets: crear set con productos
- GET /api/sets: listar activos
- GET /api/sets/[id]: obtener uno
- PUT /api/sets/[id]: editar set + reemplazar productos
- DELETE /api/sets/[id]: eliminar sin afectar productos

### E2E Tests (Página Admin)
- Crear set completo (nombre, descripción, precio, categoría, imágenes, productos)
- Editar set (cambiar nombre, agregar productos, remover imágenes)
- Eliminar set con confirmación
- Validar que no se pueda activar set sin productos
- Validar badge estado en tabla

### Manual Testing Checklist
- [x] Crear set sin productos → guardar como draft (is_active = false)
- [x] Activar set sin productos → error validación
- [x] Agregar producto inactivo → advertencia visual
- [x] Cambiar cantidad productos → reflejado en tabla
- [x] Eliminar set → productos siguen existiendo
- [x] Upload imágenes → guardadas en Storage, rutas correctas
- [x] Editar set existente → todos los campos actualizables
- [x] Slug automático → resolver duplicados con sufijo
- [x] Estado badge → clickeable para toggle activo/inactivo

---

## 8. Código Coverage & Métricas

**Target**: 85% code coverage (mínimo obligatorio)

Áreas críticas:
- API handlers (create, update, delete) → 95%
- Validaciones (slug, quantities, activation) → 90%
- Image upload logic → 85%
- Component integrations → 80%

---

## 9. Fases de Implementación

### Fase 1: Setup & Modelos (Day 1)
- Crear tipos/interfaces TypeScript
- Schema zod para validaciones
- Funciones utilidad (slug generation, etc)
- Test cases para lógica pura

### Fase 2: API Routes (Day 1-2)
- Implementar GET /api/sets (público)
- Implementar POST /api/sets (admin)
- Implementar GET /api/sets/[id]
- Implementar PUT /api/sets/[id]
- Implementar DELETE /api/sets/[id]
- Tests de integración

### Fase 3: Admin UI Componentes (Day 2-3)
- SetsTable (listado)
- SetForm (crear/editar)
- ProductSelector (selector de productos)
- ImageUploader (carga de imágenes)
- DeleteDialog (confirmación)

### Fase 4: Integración & Polish (Day 3)
- Conectar componentes con APIs
- Manejo de errores y edge cases
- UX refinements (toasts, validaciones visuales)
- E2E testing
- Documentación code

### Fase 5: QA & Deploy (Day 4)
- Manual testing full flow
- Coverage check (85%+)
- Code review
- Deployment a staging

---

## 10. Deferred (MVP 2 o posterior)

- Stock management por set
- Reordenamientos de productos en set
- Historial de cambios (auditoría)
- Búsqueda y filtros avanzados en tabla
- Duplicación de sets (clone)
- Opciones de producto variable (tallas, colores, etc)
- Cálculo automático de precio

---

## 11. Referencias

- Especificación funcional: `/sdd/specs/gestion-sets.md`
- DB Schema: Fase 0 migrations (sets, set_items)
- Stack: Next.js 16, Supabase, shadcn/ui, react-hook-form + zod
- API Response: RESTful con estructura `{ data: ... }`
- Auth: Admin-only writes, public reads activos
