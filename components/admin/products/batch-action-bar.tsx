"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BatchPriceDialog } from "./batch-price-dialog";
import type { Product, Category } from "@/types";

interface BatchActionBarProps {
  selectedIds: Set<string>;
  products: Product[];
  categories: Category[];
  onClearSelection: () => void;
  onSuccess: () => void;
}

export function BatchActionBar({
  selectedIds,
  products,
  categories,
  onClearSelection,
  onSuccess,
}: BatchActionBarProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);

  const count = selectedIds.size;
  const ids = Array.from(selectedIds);
  const selectedProducts = products.filter((p) => selectedIds.has(p.id));

  if (count === 0) return null;

  async function applyBatch(changes: Record<string, unknown>, key: string) {
    setLoading(key);
    try {
      const res = await fetch("/api/products/batch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, changes }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al aplicar cambios");
        return;
      }
      toast.success(`${count} producto${count !== 1 ? "s" : ""} actualizados`);
      onClearSelection();
      onSuccess();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar ${count} producto${count !== 1 ? "s" : ""}? Esta acción no se puede deshacer.`)) return;
    setLoading("delete");
    try {
      const res = await fetch("/api/products/batch", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar");
        return;
      }
      toast.success(`${count} producto${count !== 1 ? "s" : ""} eliminados`);
      onClearSelection();
      onSuccess();
    } finally {
      setLoading(null);
    }
  }

  const busy = !!loading;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <span className="text-sm font-semibold text-gray-900">
              {count} seleccionado{count !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Limpiar
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyBatch({ is_active: true }, "active")}
            >
              Activar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyBatch({ is_active: false }, "inactive")}
            >
              Desactivar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyBatch({ featured: true }, "featured")}
            >
              Destacar
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => applyBatch({ featured: false }, "unfeatured")}
            >
              Sin destacar
            </Button>

            <Select
              disabled={busy}
              onValueChange={(v) => applyBatch({ category_id: v === "none" ? null : v }, "category")}
            >
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue placeholder="Mover a categoría..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setPriceDialogOpen(true)}
            >
              Precio
            </Button>

            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the bar */}
      <div className="h-20" />

      <BatchPriceDialog
        open={priceDialogOpen}
        onOpenChange={setPriceDialogOpen}
        selectedProducts={selectedProducts}
        onSuccess={() => {
          onClearSelection();
          onSuccess();
          setPriceDialogOpen(false);
        }}
      />
    </>
  );
}
