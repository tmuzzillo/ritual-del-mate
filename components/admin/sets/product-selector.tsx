"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, X, Search, Gift } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product, ProductVariation } from "@/types";

export interface SelectedItem {
  product_id: string;
  quantity: number;
  product: Product;
  variation_id?: string | null;
  variation?: ProductVariation | null;
  variations?: ProductVariation[]; // active variations available for this product
  is_gift: boolean;
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
  const [pendingVariationPick, setPendingVariationPick] = useState<string | null>(null);
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

  async function addProduct(product: Product) {
    if (selected.some((s) => s.product_id === product.id)) return;
    setQuery("");
    setOpen(false);

    // Fetch active variations for this product
    let variations: ProductVariation[] = [];
    try {
      const res = await fetch(`/api/products/${product.id}/variations`);
      const json = await res.json();
      variations = (json.data as ProductVariation[]).filter(v => v.is_active);
    } catch {
      // Ignore — product has no variations
    }

    const newItem: SelectedItem = {
      product_id: product.id,
      quantity: 1,
      product,
      variation_id: null,
      variation: null,
      variations,
      is_gift: false,
    };

    onChange([...selected, newItem]);

    if (variations.length > 0) {
      setPendingVariationPick(product.id);
    }
  }

  function removeProduct(productId: string) {
    onChange(selected.filter((s) => s.product_id !== productId));
    if (pendingVariationPick === productId) setPendingVariationPick(null);
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

  function toggleGift(productId: string) {
    onChange(
      selected.map((s) =>
        s.product_id === productId ? { ...s, is_gift: !s.is_gift } : s
      )
    );
  }

  function pickVariation(productId: string, variation: ProductVariation) {
    onChange(
      selected.map((s) =>
        s.product_id === productId
          ? { ...s, variation_id: variation.id, variation }
          : s
      )
    );
    setPendingVariationPick(null);
  }

  const selectedIds = new Set(selected.map((s) => s.product_id));

  return (
    <div className="space-y-3">
      {/* Selected products */}
      {selected.length > 0 && (
        <ul className="space-y-2">
          {selected.map((item) => {
            const { product, quantity, product_id, variation, variations = [], is_gift } = item;
            const isPending = pendingVariationPick === product_id;

            return (
              <li key={product_id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{product.name}</span>
                    {!product.is_active && (
                      <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">Inactivo</Badge>
                    )}
                    {variation && (
                      <span className="text-xs text-brand-brown">Variación: {variation.label}</span>
                    )}
                    {!variation && variations.length > 0 && !isPending && (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setPendingVariationPick(product_id)}
                      >
                        Elegir variación
                      </button>
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 transition-colors ${is_gift ? "text-brand-orange" : "text-gray-300 hover:text-gray-400"}`}
                    title={is_gift ? "Quitar regalo" : "Marcar como regalo"}
                    onClick={() => toggleGift(product_id)}
                  >
                    <Gift className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-gray-400"
                    onClick={() => removeProduct(product_id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                {/* Variation picker — shown when product has variations and none selected */}
                {isPending && variations.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Elegí una variación:</p>
                    <div className="flex flex-wrap gap-2">
                      {variations.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => pickVariation(product_id, v)}
                          className="flex flex-col items-center gap-1 p-1 rounded-md border-2 border-transparent hover:border-brand-orange transition-colors"
                        >
                          <div className="relative w-12 h-12 rounded bg-brand-cream overflow-hidden">
                            {v.images[0] ? (
                              <Image src={v.images[0]} alt={v.label} fill className="object-contain" sizes="48px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">?</div>
                            )}
                          </div>
                          <span className="text-xs text-brand-dark">{v.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
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
