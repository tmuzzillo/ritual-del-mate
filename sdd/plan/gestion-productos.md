# Plan de Ejecución: Gestión de Productos (Admin)

**Documento**: Plan de ejecución técnico
**Fecha**: 2026-02-28
**Feature**: Gestión de productos en panel administrativo

---

## 1. Dependencias

### Prerequisitos bloqueantes
- **Tabla `categories`** debe existir y ser accesible (requerida para FK `category_id`)
- **Supabase Storage bucket `images`** debe estar creado y configurado
- **RLS policies en tabla `products`** deben estar activas (lectura pública, escritura solo admin)
- **Autenticación admin** funcional en el proyecto (`useAuth()` o similar disponible)

### Dependencias internas
- Schema TypeScript/Zod para validación de productos
- Utilities para generación de slugs (normalización: minúsculas, guiones)
- Hook para detectar si usuario es admin

---

## 2. Base de Datos

### Tabla `products` (ya creada en Fase 0)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC,  -- nullable, opcional
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Índices recomendados (agregar si no existen)
```sql
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_active ON products(is_active);
```

### Row-Level Security (RLS)
**Lectura (`SELECT`)**:
- Usuarios públicos leen solo productos activos (`is_active = true`)
- Admin lee todos los productos (activos e inactivos)

**Escritura (`INSERT`, `UPDATE`, `DELETE`)**:
- Solo admin puede escribir
- Usuario anónimo rechazado

**Referencia**: Validar RLS en script de migración o panel de Supabase

---

## 3. API Routes

### GET `/api/products` (Pública)
**Propósito**: Listar productos para catálogo público
**Query params**:
- `?all=true` (solo admin, retorna activos + inactivos)
- Sin parámetros: retorna solo `is_active = true`

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Mate Clásico",
      "slug": "mate-clasico",
      "description": "...",
      "price": 150.50,
      "stock": 100,
      "images": ["https://..."],
      "category": {
        "id": "uuid",
        "name": "Mates"
      },
      "is_active": true,
      "created_at": "2026-02-28T..."
    }
  ]
}
```

**Implementación**:
- Join con `categories` para incluir datos de categoría
- Filtro: `is_active = true` si no es admin o `?all=false`
- Ordenar por `created_at DESC`

---

### POST `/api/products` (Admin only)
**Propósito**: Crear nuevo producto
**Validación antes de guardar**:
- `name`: requerido, no vacío
- `slug`: requerido, único (verificar en BD)
- `description`: opcional
- `price`: opcional; si se especifica, debe ser > 0
- `category_id`: opcional (UUID válido si se proporciona)
- `images`: array de URLs; requerido tener al menos 1 para publicar (`is_active = true`)
- `is_active`: booleano; rechazar si `true` y no hay imágenes

**Error handling**:
- 401 si no autenticado
- 403 si no es admin
- 400 si slug duplicado (mensaje: "El slug ya existe")
- 400 si validación falla

**Response**:
```json
{
  "id": "uuid",
  "name": "...",
  "slug": "...",
  ...
}
```

---

### GET `/api/products/[id]` (Pública, con visibilidad según rol)
**Propósito**: Obtener detalle de un producto
**Lógica**:
- Si producto `is_active = true`: acceso público
- Si producto `is_active = false`: solo admin

**Response**: Objeto producto completo con categoría relación incluida

---

### PUT `/api/products/[id]` (Admin only)
**Propósito**: Editar producto existente
**Validación**:
- Mismo set de validaciones que POST
- Al cambiar nombre: regenerar slug automáticamente (si slug manual no se proporcionó o es igual)
- Si se intenta cambiar slug manualmente: validar unicidad (excluyendo el producto actual)
- Si `is_active = true`: requiere al menos 1 imagen

**Detalle: Manejo de slug**
- Si `name` cambió y `slug` no se editó manualmente → regenerar slug
- Si `slug` fue editado manualmente → validar contra otros productos
- Prevenir slug vacío o inválido

**Error handling**:
- 401, 403: no autenticado/admin
- 404: producto no existe
- 400: validación fallida (slug duplicado, precio inválido, sin imágenes para publicar)

---

### DELETE `/api/products/[id]` (Admin only)
**Propósito**: Eliminar producto
**Checks antes de eliminar**:
- Verificar si producto está en tabla `set_items` (FK `product_id`)
- Si está vinculado: rechazar con 409 y mensaje "Este producto está en un conjunto. Elimínelo del conjunto primero"

**Limpieza**:
- Eliminar filas en `set_items` que referencien este producto (alternativa: ON DELETE CASCADE)
- NO eliminar imágenes de Storage automáticamente (deferred a MVP 2)

**Response**: 204 No Content o `{ "success": true }`

---

## 4. Subida de Imágenes

### Flujo de upload
1. **Frontend**: Admin selecciona archivo(s) desde un `<input type="file">`
2. **Validación local**: Verificar tipo MIME (image/png, image/jpeg, etc.), tamaño < 5MB
3. **Upload a Storage**:
   ```typescript
   const { data, error } = await supabase.storage
     .from('images')
     .upload(`products/${productId}/${file.name}`, file, {
       upsert: false,
       contentType: file.type
     });
   ```
4. **Obtener URL pública**:
   ```typescript
   const { data } = supabase.storage
     .from('images')
     .getPublicUrl(`products/${productId}/${file.name}`);
   ```
5. **Guardar URL en array `images[]`**: Agregar `data.publicUrl` al array de imágenes
6. **Guardar en BD**: El endpoint PUT/POST recibe array de URLs en `images`

### Validaciones
- Extensión: `.jpg`, `.jpeg`, `.png`, `.webp`
- Tamaño: máx 5MB por imagen
- Cantidad mínima para publicar: 1
- Cantidad máxima por producto: 10 (MVP 1)

### Error handling
- Si upload falla: mostrar toast con mensaje de error
- Si el URL no se obtiene: registrar error, no guardar en BD

---

## 5. Admin UI (`app/admin/productos/page.tsx`)

### Vista principal: Tabla de productos

**Columnas**:
| Columna | Contenido |
|---------|-----------|
| Nombre | Nombre del producto (clickeable → edición) |
| Precio | Precio formateado; "Sin precio" si null |
| Categoría | Nombre de categoría o "—" si null |
| Estado | Badge (verde "Activo" / gris "Inactivo") |
| Acciones | Botones Editar, Eliminar |

**Características**:
- Botón flotante "Crear producto" (FAB o header button)
- Tabla vacía: mensaje "No hay productos" + botón "Crear uno"
- Carga: skeleton loaders o spinner
- Actualización automática después de crear/editar/eliminar

---

### Formulario de crear/editar producto

**Modal o página separada**: A definir (preferencia: Modal para rapidez)

**Campos**:
1. **Nombre** (text input)
   - Requerido
   - onChange: regenerar slug automáticamente (si slug no fue editado manualmente)
   - Validación: no vacío

2. **Slug** (text input)
   - Generado automáticamente de nombre
   - Editable manualmente
   - Validación: único, caracteres válidos (a-z, 0-9, guiones)
   - Error si duplicado

3. **Descripción** (textarea)
   - Opcional
   - Placeholder: "Describe el producto..."

4. **Precio** (number input)
   - Opcional
   - Validación: si se especifica, debe ser > 0
   - Placeholder: "0.00"

5. **Categoría** (select combobox)
   - Opcional
   - Opciones: cargar de `/api/categories` (o prop)
   - Opción "Sin categoría"

6. **Imágenes** (file input + preview)
   - Input: aceptar múltiples archivos
   - Preview: galería de imágenes subidas
   - Botón "+ Agregar imagen"
   - Cada imagen con botón × para eliminar
   - Validación: si `is_active = true`, requiere ≥ 1 imagen
   - Error en upload: mostrar toast

7. **Activo/Inactivo** (checkbox/toggle)
   - Etiqueta: "Publicar producto"
   - Validación: rechazar si no hay imágenes y se intenta activar
   - Error: "Debe tener al menos una imagen para publicar"

**Botones de acción**:
- "Cancelar" → cerrar modal
- "Guardar" → validar, submit, actualizar tabla

---

### Eliminar producto

**Flujo**:
1. Admin hace clic en botón "Eliminar" en la fila o en el detalle
2. Se abre diálogo de confirmación:
   - Título: "¿Eliminar producto?"
   - Texto: "No se puede deshacer esta acción"
   - Si producto está en un set: agregar advertencia roja: "⚠️ Este producto está en un conjunto. Debe eliminarlo del conjunto primero"
   - Botones: "Cancelar" | "Eliminar" (rojo)
3. Si confirmado y no hay warning: llamar DELETE `/api/products/[id]`
4. Si hay warning: deshabilitar botón eliminar o mostrar error

---

## 6. Componentes y Helpers

### Archivos a crear/modificar

**Componentes**:
- `/components/admin/ProductTable.tsx` — Tabla de productos
- `/components/admin/ProductForm.tsx` — Formulario crear/editar (reutilizable)
- `/components/admin/ProductImageUpload.tsx` — Subida de imágenes
- `/components/admin/ConfirmDeleteDialog.tsx` — Diálogo de confirmación

**Pages**:
- `/app/admin/productos/page.tsx` — Vista principal (modify)
- `/app/admin/productos/[id]/page.tsx` — Detalle/edición (crear)

**API**:
- `/app/api/products/route.ts` — GET (all), POST (modify)
- `/app/api/products/[id]/route.ts` — GET, PUT, DELETE (crear)

**Utils/Hooks**:
- `/lib/utils/slug.ts` — Generador de slugs
- `/hooks/useAdmin.ts` — Verificar rol admin
- `/lib/validations/product.ts` — Schema Zod para validación

---

## 7. Validaciones (Frontend + Backend)

### Schema Zod
```typescript
const ProductSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug inválido"),
  description: z.string().optional(),
  price: z.number().positive("Debe ser mayor a 0").optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  images: z.array(z.string().url()).min(0),
  is_active: z.boolean(),
});
```

**Validaciones adicionales (en handler)**:
- Slug único (query a BD)
- Si `is_active = true` y `images.length === 0` → error
- Precio > 0 si se proporciona

---

## 8. Criterios de Aceptación (Testing Checklist)

- [ ] Admin crea producto: nombre, slug auto, descripción, precio, categoría, imágenes, estado
- [ ] Slug duplicado muestra error en formulario
- [ ] Admin intenta publicar sin imágenes: error "Debe tener al menos una imagen"
- [ ] Precio negativo/cero rechazado
- [ ] Admin edita nombre → slug se regenera automáticamente
- [ ] Admin edita slug manualmente → valida unicidad
- [ ] Admin elimina todas las imágenes e intenta publicar → error
- [ ] Admin desactiva producto desde toggle → desaparece del catálogo público
- [ ] Admin intenta eliminar producto en un set → advertencia
- [ ] Tabla lista todos los productos (activos e inactivos para admin)
- [ ] Tabla vacía muestra CTA "Crear producto"
- [ ] Validación de slug en tiempo real o al guardar

---

## 9. Deferred (MVP 2)

- Gestión de stock (cantidades disponibles, alerta bajo stock)
- Acciones en lote (eliminar múltiples, activar/desactivar)
- Reordenamiento de imágenes (drag & drop)
- Limpieza automática de imágenes en Storage al eliminar producto
- Búsqueda y filtrado avanzado en tabla (por categoría, precio, estado)
- Editor de texto enriquecido para descripciones

---

## 10. Notas de Implementación

1. **Slug generation**: Usar librería como `slugify` o implementar función simple (lowercase, replace spaces con `-`, remove special chars)
2. **Image URLs**: Guardar rutas públicas de Supabase Storage en array; no regresar blobs
3. **Category loading**: Si la tabla `categories` no existe aún, crear endpoint stub que retorne array vacío
4. **Admin check**: Validar `user.role === 'admin'` o similar en middleware/RPC
5. **Optimistic updates**: Considerar actualizar tabla inmediatamente en frontend después de acciones, validar en background
6. **Error toasts**: Usar librería de toast (ej: `sonner`, `react-toastify`) para feedback del usuario

