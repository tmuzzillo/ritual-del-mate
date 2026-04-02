"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/product-card";
import type { Product, Category } from "@/types";

interface CatalogFilterProps {
  products: Product[];
  categories: Category[];
}

export function CatalogFilter({ products, categories }: CatalogFilterProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = selected
    ? products.filter((p) => p.category?.slug === selected)
    : products;

  return (
    <div>
      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelected(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
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
              onClick={() => setSelected(cat.slug)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
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
          <p className="text-brand-brown text-lg">No hay productos en esta categoría.</p>
          <button
            onClick={() => setSelected(null)}
            className="text-brand-orange font-semibold hover:text-brand-orange-hover transition-colors"
          >
            Ver todos los productos →
          </button>
        </div>
      )}
    </div>
  );
}
