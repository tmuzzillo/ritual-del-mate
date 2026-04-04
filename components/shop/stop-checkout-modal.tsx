"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface StopCheckoutModalProps {
  open: boolean;
  itemName: string;
  onRemoveAndContinue: () => void;
  onBack: () => void;
}

export function StopCheckoutModal({
  open,
  itemName,
  onRemoveAndContinue,
  onBack,
}: StopCheckoutModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onBack(); }}>
      <DialogContent showCloseButton={false} className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-brand-dark">Producto sin stock</DialogTitle>
          <DialogDescription className="text-brand-warm-gray">
            <span className="font-semibold text-brand-dark">{itemName}</span> ya no tiene stock
            disponible. Podés eliminarlo del carrito y continuar con el resto de tu compra.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <button
            onClick={onRemoveAndContinue}
            className="w-full py-3 px-6 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-semibold rounded-xl transition-colors text-sm"
          >
            Eliminar del carrito y continuar
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 px-6 border border-brand-sand text-brand-dark font-semibold rounded-xl hover:bg-brand-cream transition-colors text-sm"
          >
            Volver al carrito
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
