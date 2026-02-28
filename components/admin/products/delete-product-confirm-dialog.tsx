"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

interface DeleteProductConfirmDialogProps {
  product: Product | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteProductConfirmDialog({
  product,
  onOpenChange,
  onSuccess,
}: DeleteProductConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar el producto");
        return;
      }
      toast.success("Producto eliminado");
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar producto</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-700 py-2">
          ¿Eliminar el producto <span className="font-semibold">{product.name}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={loading} onClick={handleConfirm}>
            {loading ? "Eliminando..." : "Confirmar eliminación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
