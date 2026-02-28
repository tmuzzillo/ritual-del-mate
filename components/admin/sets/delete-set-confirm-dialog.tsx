"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { MateSet } from "@/types";

interface DeleteSetConfirmDialogProps {
  set: MateSet | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteSetConfirmDialog({
  set,
  onOpenChange,
  onSuccess,
}: DeleteSetConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!set) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al eliminar el set");
        return;
      }
      toast.success("Set eliminado");
      onOpenChange(false);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  if (!set) return null;

  return (
    <Dialog open={!!set} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Eliminar set</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-700 py-2">
          ¿Eliminar el set <span className="font-semibold">{set.name}</span>?
          Los productos que lo componen no se eliminarán. Esta acción no se puede deshacer.
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
