-- Migración: 001_init_schema.sql
-- Creada: 2026-02-28

-- ============================================
-- TABLA: categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
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
  is_active BOOLEAN NOT NULL DEFAULT false,
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
  is_active BOOLEAN NOT NULL DEFAULT false,
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
  is_active BOOLEAN NOT NULL DEFAULT false,
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
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_sets_category_id ON public.sets(category_id);
CREATE INDEX IF NOT EXISTS idx_sets_is_active ON public.sets(is_active);
CREATE INDEX IF NOT EXISTS idx_sets_slug ON public.sets(slug);
CREATE INDEX IF NOT EXISTS idx_set_items_set_id ON public.set_items(set_id);
CREATE INDEX IF NOT EXISTS idx_set_items_product_id ON public.set_items(product_id);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON public.collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON public.collections(slug);
CREATE INDEX IF NOT EXISTS idx_collection_products_product_id ON public.collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_collection_sets_set_id ON public.collection_sets(set_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_sets ENABLE ROW LEVEL SECURITY;

-- Lectura pública para todas las tablas
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read sets" ON public.sets FOR SELECT USING (true);
CREATE POLICY "Public read set_items" ON public.set_items FOR SELECT USING (true);
CREATE POLICY "Public read collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Public read collection_products" ON public.collection_products FOR SELECT USING (true);
CREATE POLICY "Public read collection_sets" ON public.collection_sets FOR SELECT USING (true);

-- Escritura solo para usuarios autenticados
CREATE POLICY "Auth write categories" ON public.categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update categories" ON public.categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete categories" ON public.categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write products" ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update products" ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete products" ON public.products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write sets" ON public.sets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update sets" ON public.sets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete sets" ON public.sets FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write set_items" ON public.set_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update set_items" ON public.set_items FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete set_items" ON public.set_items FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write collections" ON public.collections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update collections" ON public.collections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete collections" ON public.collections FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write collection_products" ON public.collection_products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth delete collection_products" ON public.collection_products FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Auth write collection_sets" ON public.collection_sets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth delete collection_sets" ON public.collection_sets FOR DELETE USING (auth.role() = 'authenticated');
