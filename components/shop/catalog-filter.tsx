"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import type { Product, Category } from "@/types";

interface CatalogFilterProps {
  products: Product[];
  categories: Category[];
}

export function CatalogFilter({ products, categories }: CatalogFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selected = searchParams.get("categoria");
  const query = searchParams.get("q") ?? "";

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (categoria: string | null, q: string) => {
      const params = new URLSearchParams();
      if (categoria) params.set("categoria", categoria);
      if (q.trim()) params.set("q", q.trim());
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  function handleCategoryClick(slug: string | null) {
    updateParams(slug, query);
  }

  function handleQueryChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams(selected, value);
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const filtered = products.filter((p) => {
    const matchesCategory = selected ? p.category?.slug === selected : true;
    const matchesQuery = query.trim()
      ? p.name.toLowerCase().includes(query.trim().toLowerCase())
      : true;
    return matchesCategory && matchesQuery;
  });

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-brown pointer-events-none" />
        <input
          type="text"
          defaultValue={query}
          key={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Buscar productos..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-brand-sand bg-white text-sm text-brand-dark placeholder:text-brand-brown/60 focus:outline-none focus:border-brand-orange transition-colors"
        />
        {query && (
          <button
            onClick={() => updateParams(selected, "")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-brown hover:text-brand-dark transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category filters — single scrollable row */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              selected === null
                ? "bg-brand-dark text-white border-brand-dark"
                : "text-brand-dark border-brand-sand hover:border-brand-dark"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.slug)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                selected === cat.slug
                  ? "bg-brand-dark text-white border-brand-dark"
                  : "text-brand-dark border-brand-sand hover:border-brand-dark"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <p className="text-brand-brown text-lg">No hay productos que coincidan.</p>
          <button
            onClick={() => updateParams(null, "")}
            className="text-brand-orange font-semibold hover:text-brand-orange-hover transition-colors"
          >
            Ver todos los productos →
          </button>
        </div>
      )}
    </div>
  );
}
