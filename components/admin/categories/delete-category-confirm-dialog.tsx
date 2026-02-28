"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CategoryWithCount } from "./category-table";

interface DeleteCategoryConfirmDialogProps {
  category: CategoryWithCount | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCategoryConfirmDialog({
  category,
  onOpenChange,
  onSuccess,
}: DeleteCategoryConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  function handleClose() {
    onOpenChange(false);
  }

  async function handleConfirm() {
    if (!category) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar la categoría");
        return;
      }
      toast.success("Categoría eliminada");
      handleClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (!category) return null;

  const hasProducts = category.product_count > 0;

  return (
    <Dialog open={!!category} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar categoría</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {hasProducts ? (
            <p className="text-sm text-gray-700">
              ¿Eliminar la categoría{" "}
              <span className="font-semibold">{category.name}</span>? Tiene{" "}
              <Badge variant="destructive" className="text-xs">
                {category.product_count}{" "}
                {category.product_count === 1 ? "producto" : "productos"}
              </Badge>{" "}
              asociados. Al eliminarla, estos productos quedarán sin categoría.
            </p>
          ) : (
            <p className="text-sm text-gray-700">
              ¿Eliminar la categoría{" "}
              <span className="font-semibold">{category.name}</span>? Esta
              acción no se puede deshacer.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Eliminando..." : "Confirmar eliminación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
