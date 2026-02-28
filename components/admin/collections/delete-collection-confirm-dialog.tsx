"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Collection } from "@/types";

interface DeleteCollectionConfirmDialogProps {
  collection: Collection | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCollectionConfirmDialog({
  collection,
  onOpenChange,
  onSuccess,
}: DeleteCollectionConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!collection) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar la colección");
        return;
      }
      toast.success("Colección eliminada");
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (!collection) return null;

  return (
    <Dialog open={!!collection} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar colección</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-700 py-2">
          ¿Eliminar la colección <span className="font-semibold">{collection.name}</span>?
          Los productos y sets que la componen <strong>no se eliminarán</strong>.
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
