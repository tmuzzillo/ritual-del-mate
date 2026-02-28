import { createClient } from "@/lib/supabase/server";
import { CatalogFilter } from "@/components/shop/catalog-filter";
import type { Product, Category } from "@/types";

export default async function CatalogoPage() {
  const supabase = await createClient();

  const [{ data: allProducts }, { data: allCategories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, category:categories(id, name, slug)")
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name, slug").order("name"),
  ]);

  const products = (allProducts ?? []) as Product[];

  // Solo mostrar categorías que tienen al menos un producto activo
  const activeCategorySlugs = new Set(
    products.map((p) => p.category?.slug).filter(Boolean)
  );
  const categories = ((allCategories ?? []) as Category[]).filter((c) =>
    activeCategorySlugs.has(c.slug)
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold text-brand-charcoal mb-6">Catálogo</h1>
      <CatalogFilter products={products} categories={categories} />
    </div>
  );
}
