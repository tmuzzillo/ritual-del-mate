"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types";

interface BatchPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onSuccess: () => void;
}

export function BatchPriceDialog({
  open,
  onOpenChange,
  selectedProducts,
  onSuccess,
}: BatchPriceDialogProps) {
  const [mode, setMode] = useState<"fixed" | "percentage">("fixed");
  const [fixedValue, setFixedValue] = useState("");
  const [pctValue, setPctValue] = useState("");
  const [loading, setLoading] = useState(false);

  const withPrice = selectedProducts.filter((p) => p.price != null);
  const withoutPrice = selectedProducts.filter((p) => p.price == null);

  function getPreview(): string | null {
    if (mode === "fixed") {
      const v = parseFloat(fixedValue);
      if (isNaN(v) || v <= 0) return null;
      const n = selectedProducts.length;
      return `$${v.toLocaleString("es-AR")} para ${n} producto${n !== 1 ? "s" : ""}`;
    } else {
      const pct = parseFloat(pctValue);
      if (isNaN(pct)) return null;
      if (withPrice.length === 0) return "Ningún producto tiene precio asignado";
      const examples = withPrice.slice(0, 2).map((p) => {
        const newPrice = Math.round(p.price! * (1 + pct / 100));
        return `${p.name}: $${p.price!.toLocaleString("es-AR")} → $${newPrice.toLocaleString("es-AR")}`;
      });
      const suffix = withPrice.length > 2 ? ` (+${withPrice.length - 2} más)` : "";
      return examples.join(" · ") + suffix;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      if (mode === "fixed") {
        const price = parseFloat(fixedValue);
        if (isNaN(price) || price <= 0) { toast.error("Ingresá un precio válido"); return; }
        const ids = selectedProducts.map((p) => p.id);
        const res = await fetch("/api/products/batch", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, changes: { price } }),
        });
        if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Error"); return; }
      } else {
        const pct = parseFloat(pctValue);
        if (isNaN(pct)) { toast.error("Ingresá un porcentaje válido"); return; }
        if (withPrice.length === 0) { toast.error("Ningún producto tiene precio asignado"); return; }
        const updates = withPrice.map((p) => ({
          id: p.id,
          changes: { price: Math.round(p.price! * (1 + pct / 100)) },
        }));
        const res = await fetch("/api/products/batch", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates }),
        });
        if (!res.ok) { const j = await res.json(); toast.error(j.error ?? "Error"); return; }
      }
      const n = mode === "fixed" ? selectedProducts.length : withPrice.length;
      toast.success(`${n} producto${n !== 1 ? "s" : ""} actualizados`);
      setFixedValue("");
      setPctValue("");
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const preview = getPreview();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cambiar precio</DialogTitle>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-gray-200 p-1 gap-1">
          {(["fixed", "percentage"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {m === "fixed" ? "Precio fijo" : "Porcentaje"}
            </button>
          ))}
        </div>

        {mode === "fixed" ? (
          <div className="space-y-1">
            <Label>Nuevo precio (ARS)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={fixedValue}
              onChange={(e) => setFixedValue(e.target.value)}
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-1">
            <Label>
              Porcentaje{" "}
              <span className="text-gray-400 font-normal">(positivo = sube, negativo = baja)</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                placeholder="Ej: 10 ó -15"
                value={pctValue}
                onChange={(e) => setPctValue(e.target.value)}
                className="pr-8"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
            {withoutPrice.length > 0 && (
              <p className="text-xs text-amber-600">
                {withoutPrice.length} producto{withoutPrice.length !== 1 ? "s" : ""} sin precio quedarán sin cambios
              </p>
            )}
          </div>
        )}

        {preview && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">{preview}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Aplicando..." : "Aplicar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
