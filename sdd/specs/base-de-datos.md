# Especificación de Feature: Base de Datos

**Creado**: 2026-02-28

## Developer Scenarios & Testing

### Scenario 1 - Conexión desde desarrollo local con variables de entorno (Priority: P1)

**Descripción**: Un desarrollador puede conectarse al mismo proyecto Supabase tanto en desarrollo local como en producción usando variables de entorno.

**Given**:
- El archivo `.env.local` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `.env.local` está en `.gitignore`

**When**:
- El desarrollador ejecuta `npm run dev` localmente
- O la aplicación se despliega en producción con variables de entorno configuradas

**Then**:
- La aplicación se conecta correctamente a Supabase
- Los clientes `@supabase/ssr` y `@supabase/supabase-js` funcionan sin errores
- Ambos entornos acceden al mismo proyecto Supabase

**Test**:
```bash
# Verificar que .env.local existe y contiene las keys
cat .env.local | grep NEXT_PUBLIC_SUPABASE

# Verificar que .env.local está en .gitignore
git check-ignore .env.local
# Esperado: salida sin error (archivo está ignorado)
```

---

### Scenario 2 - Todas las tablas creadas via migración única (Priority: P2)

**Descripción**: Un desarrollador ejecuta una única migración que crea todas las entidades sin intervención manual en el dashboard de Supabase.

**Given**:
- Existe un archivo SQL de migración en `/supabase/migrations/001_init_schema.sql`

**When**:
- El desarrollador ejecuta la migración (vía CLI de Supabase o script de setup)

**Then**:
- Se crean todas las tablas: `categories`, `products`, `sets`, `set_items`, `collections`, `collection_products`, `collection_sets`
- Se crean los índices necesarios
- Se aplican las restricciones de clave foránea

**Test**:
```sql
-- Verificar que todas las tablas existen
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'products', 'sets', 'set_items', 'collections', 'collection_products', 'collection_sets');
-- Esperado: 7 filas retornadas
```

---

### Scenario 3 - Bucket de Storage configurado para lectura pública (Priority: P3)

**Descripción**: El bucket `images` de Supabase Storage está configurado para lectura pública y escritura solo para administradores.

**Given**:
- El bucket `images` existe en Supabase Storage

**When**:
- Un usuario anónimo intenta descargar una imagen
- Un usuario autenticado intenta subir una imagen
- Un usuario anónimo intenta subir una imagen

**Then**:
- La descarga es exitosa (lectura pública)
- La subida del usuario autenticado requiere permisos adicionales (solo admin)
- La subida del usuario anónimo es rechazada

**Test**:
```bash
# Verificar política de bucket (via Supabase Dashboard o API)
# El bucket debe tener RLS habilitado con:
# - SELECT permitido para authenticated y anon
# - INSERT/UPDATE/DELETE solo para authenticated + role admin
```

---

### Scenario 4 - Row Level Security con lectura pública (Priority: P4)

**Descripción**: Las políticas de RLS permiten lectura pública para todas las tablas y escritura solo para usuarios autenticados.

**Given**:
- RLS está habilitado en todas las tablas

**When**:
- Un usuario anónimo consulta la tabla `products`
- Un usuario anónimo intenta modificar la tabla `products`
- Un usuario autenticado intenta modificar la tabla `products`

**Then**:
- La lectura anónima es exitosa
- La modificación anónima es rechazada
- La modificación autenticada requiere validación adicional (solo admin puede modificar)

**Test**:
```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'products', 'sets', 'sets_items', 'collections', 'collection_products', 'collection_sets');
-- Esperado: rowsecurity = true para todas las filas
```

---

### Edge Cases

1. **Borrado en cascada de categorías**: Cuando se elimina una categoría, el `category_id` de productos y sets se establece en `NULL` (no se eliminan los registros).

2. **Restricción en borrado de productos**: Un producto referenciado en `set_items` no puede ser eliminado directamente; se debe usar `ON DELETE RESTRICT` o validar antes de borrar.

3. **Cascada en sets**: Cuando se elimina un set, todos sus registros en `set_items` se eliminan automáticamente (`ON DELETE CASCADE`).

4. **Cascada en colecciones**: Cuando se elimina una colección, se eliminan automáticamente sus registros en `collection_products` y `collection_sets` (`ON DELETE CASCADE`).

5. **Variable `.env.local` comprometida**: Si `.env.local` se comunita accidentalmente, debe ser rotada la clave anon inmediatamente en Supabase.

---

### Out of Scope

- Emulación local con Supabase CLI (deferred para cuando la suite de tests lo requiera)
- Database branching o entornos preview
- Backups más allá de los defaults incluidos en el tier gratuito de Supabase
- Replicación de datos a múltiples regiones
- Implementación de auditoría detallada (audit logs)

---

## Requisitos

### Requisitos Funcionales

1. **RF1**: La aplicación debe conectarse a Supabase usando variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

2. **RF2**: Todas las entidades deben existir como tablas en PostgreSQL con sus respectivas columnas y tipos de datos.

3. **RF3**: Las relaciones entre entidades deben estar implementadas via claves foráneas (FK).

4. **RF4**: El bucket `images` debe permitir lectura pública y escritura restringida a administradores.

5. **RF5**: RLS debe estar habilitado en todas las tablas con políticas que permitan lectura pública y escritura solo para authenticated.

6. **RF6**: El archivo `.env.local` debe estar en `.gitignore` y nunca debe ser commiteado.

7. **RF7**: Todas las migraciones deben ser idempotentes y versionadas en SQL.

---

### Entidades Clave (Schema)

#### SQL de Migración Completa

```sql
-- Migración: 001_init_schema.sql
-- Creada: 2026-02-28

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLA: products
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLA: sets
-- ============================================
CREATE TABLE IF NOT EXISTS public.sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLA: set_items
-- ============================================
CREATE TABLE IF NOT EXISTS public.set_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE(set_id, product_id)
);

-- ============================================
-- TABLA: collections
-- ============================================
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- TABLA: collection_products
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_products (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, product_id)
);

-- ============================================
-- TABLA: collection_sets
-- ============================================
CREATE TABLE IF NOT EXISTS public.collection_sets (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES public.sets(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, set_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_sets_category_id ON public.sets(category_id);
CREATE INDEX IF NOT EXISTS idx_sets_is_active ON public.sets(is_active);
CREATE INDEX IF NOT EXISTS idx_set_items_set_id ON public.set_items(set_id);
CREATE INDEX IF NOT EXISTS idx_set_items_product_id ON public.set_items(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_sets_set_id ON public.collection_sets(set_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_sets ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública (SELECT)
CREATE POLICY "Public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Public read sets" ON public.sets
  FOR SELECT USING (true);

CREATE POLICY "Public read set_items" ON public.set_items
  FOR SELECT USING (true);

CREATE POLICY "Public read collections" ON public.collections
  FOR SELECT USING (true);

CREATE POLICY "Public read collection_products" ON public.collection_products
  FOR SELECT USING (true);

CREATE POLICY "Public read collection_sets" ON public.collection_sets
  FOR SELECT USING (true);

-- Políticas de escritura (INSERT, UPDATE, DELETE) solo para autenticados
-- Nota: En producción, se debe restrictar solo a usuarios con rol 'admin'
CREATE POLICY "Authenticated write categories" ON public.categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update categories" ON public.categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete categories" ON public.categories
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write products" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update products" ON public.products
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete products" ON public.products
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write sets" ON public.sets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update sets" ON public.sets
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete sets" ON public.sets
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write set_items" ON public.set_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update set_items" ON public.set_items
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete set_items" ON public.set_items
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write collections" ON public.collections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update collections" ON public.collections
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete collections" ON public.collections
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write collection_products" ON public.collection_products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete collection_products" ON public.collection_products
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated write collection_sets" ON public.collection_sets
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete collection_sets" ON public.collection_sets
  FOR DELETE USING (auth.role() = 'authenticated');
```

#### Diagrama de Relaciones

```
categories
  ├─ products (category_id FK, ON DELETE SET NULL)
  └─ sets (category_id FK, ON DELETE SET NULL)

sets
  └─ set_items (set_id FK, ON DELETE CASCADE)
      └─ products (product_id FK, ON DELETE RESTRICT)

collections
  ├─ collection_products (ON DELETE CASCADE)
  │   └─ products
  └─ collection_sets (ON DELETE CASCADE)
      └─ sets
```

---

## Criterios de Éxito

1. ✓ **Base de datos conectada**: La aplicación se conecta exitosamente a Supabase en desarrollo y producción usando variables de entorno.

2. ✓ **Schema inicializado**: Todas las 7 tablas existen con sus columnas, tipos de datos, constraints e índices correctamente definidos.

3. ✓ **Relaciones intactas**: Las claves foráneas están configuradas con las reglas de cascada apropiadas (CASCADE para sets y collections, SET NULL para categories, RESTRICT para products en set_items).

4. ✓ **RLS habilitado**: RLS está activo en todas las tablas con políticas de lectura pública y escritura solo para autenticados.

5. ✓ **Storage configurado**: El bucket `images` permite lectura pública y escritura restringida.

6. ✓ **Migración reproducible**: La migración SQL es idempotente y puede ejecutarse múltiples veces sin errores.

7. ✓ **Variables de entorno seguras**: `.env.local` está en `.gitignore` y nunca es commiteado.

8. ✓ **Documentación de cliente**: Los desarrolladores pueden usar `@supabase/ssr` y `@supabase/supabase-js` sin configuración manual adicional.
