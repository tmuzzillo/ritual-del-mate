"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export interface SelectedItem {
  product_id: string;
  quantity: number;
  product: Product;
}

interface ProductSelectorProps {
  selected: SelectedItem[];
  onChange: (items: SelectedItem[]) => void;
}

export function ProductSelector({ selected, onChange }: ProductSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("/api/products?admin=true");
        const json = await res.json();
        const q = query.toLowerCase();
        const filtered = (json.data as Product[]).filter(
          (p) => p.name.toLowerCase().includes(q)
        );
        setResults(filtered);
        setOpen(true);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addProduct(product: Product) {
    if (selected.some((s) => s.product_id === product.id)) return;
    onChange([...selected, { product_id: product.id, quantity: 1, product }]);
    setQuery("");
    setOpen(false);
  }

  function removeProduct(productId: string) {
    onChange(selected.filter((s) => s.product_id !== productId));
  }

  function updateQuantity(productId: string, delta: number) {
    onChange(
      selected.map((s) =>
        s.product_id === productId
          ? { ...s, quantity: Math.max(1, s.quantity + delta) }
          : s
      )
    );
  }

  const selectedIds = new Set(selected.map((s) => s.product_id));

  return (
    <div className="space-y-3">
      {/* Selected products */}
      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map(({ product, quantity, product_id }) => (
            <li key={product_id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium truncate block">{product.name}</span>
                {!product.is_active && (
                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">Inactivo</Badge>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => updateQuantity(product_id, -1)}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantity}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => updateQuantity(product_id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400"
                onClick={() => removeProduct(product_id)}>
                <X className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Search */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Buscar producto por nombre..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
        </div>

        {open && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
            {searching && (
              <p className="px-3 py-2 text-sm text-gray-500">Buscando...</p>
            )}
            {!searching && results.length === 0 && (
              <p className="px-3 py-2 text-sm text-gray-500">Sin resultados.</p>
            )}
            {!searching && results.map((product) => {
              const isSelected = selectedIds.has(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isSelected}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  onClick={() => addProduct(product)}
                >
                  <span className="truncate">{product.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {product.price != null && (
                      <span className="text-gray-500">${product.price.toLocaleString("es-AR")}</span>
                    )}
                    {isSelected && <Badge variant="secondary" className="text-xs">Agregado</Badge>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
