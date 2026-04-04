"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { StopCheckoutModal } from "@/components/shop/stop-checkout-modal";
import { useCart } from "@/components/shop/cart-provider";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const router = useRouter();
  const [blockingItem, setBlockingItem] = useState<{ name: string; id: string; variationId?: string } | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);

  async function handleGoToCheckout() {
    if (items.length === 0) return;
    setCheckingStock(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Verificar stock de productos
      const productItems = items.filter((i) => i.item_type === "product");
      const variationItems = productItems.filter((i) => i.variation_id);
      const plainProductItems = productItems.filter((i) => !i.variation_id);

      if (plainProductItems.length > 0) {
        const ids = plainProductItems.map((i) => i.id);
        const { data: products } = await supabase
          .from("products")
          .select("id, name, stock")
          .in("id", ids);

        for (const cartItem of plainProductItems) {
          const product = products?.find((p) => p.id === cartItem.id);
          if (!product || product.stock < cartItem.quantity) {
            setBlockingItem({ name: cartItem.name, id: cartItem.id, variationId: undefined });
            setCheckingStock(false);
            return;
          }
        }
      }

      if (variationItems.length > 0) {
        const ids = variationItems.map((i) => i.variation_id!);
        const { data: variations } = await supabase
          .from("product_variations")
          .select("id, stock")
          .in("id", ids);

        for (const cartItem of variationItems) {
          const variation = variations?.find((v) => v.id === cartItem.variation_id);
          if (!variation || variation.stock < cartItem.quantity) {
            setBlockingItem({ name: cartItem.name, id: cartItem.id, variationId: cartItem.variation_id });
            setCheckingStock(false);
            return;
          }
        }
      }

      // Todo OK
      onClose();
      router.push("/checkout");
    } catch {
      // En caso de error de red, dejar pasar al checkout (el RPC validará)
      onClose();
      router.push("/checkout");
    } finally {
      setCheckingStock(false);
    }
  }

  function handleRemoveAndContinue() {
    if (!blockingItem) return;
    removeItem(blockingItem.id, blockingItem.variationId);
    setBlockingItem(null);
    onClose();
    router.push("/checkout");
  }

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b border-brand-sand">
            <SheetTitle className="text-brand-dark font-bold text-lg">Tu carrito</SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="text-brand-warm-gray text-sm">Tu carrito está vacío</p>
              <Link
                href="/catalogo"
                onClick={onClose}
                className="text-brand-terracotta font-semibold text-sm hover:underline"
              >
                Ver catálogo
              </Link>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {items.map((item) => (
                  <CartItemRow
                    key={`${item.id}_${item.variation_id ?? "base"}`}
                    item={item}
                    onUpdateQty={(qty) => updateQuantity(item.id, qty, item.variation_id)}
                    onRemove={() => removeItem(item.id, item.variation_id)}
                  />
                ))}
              </div>

              <div className="px-6 py-4 border-t border-brand-sand space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">Total</span>
                  <span className="text-lg font-bold text-brand-orange">{formatPrice(totalPrice)}</span>
                </div>
                <button
                  onClick={handleGoToCheckout}
                  disabled={checkingStock}
                  className="w-full py-3.5 px-6 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-60"
                >
                  {checkingStock ? "Verificando stock..." : "Ir al checkout"}
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 border border-brand-sand text-brand-dark font-semibold rounded-xl hover:bg-brand-cream transition-colors text-sm"
                >
                  Seguir comprando
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <StopCheckoutModal
        open={blockingItem !== null}
        itemName={blockingItem?.name ?? ""}
        onRemoveAndContinue={handleRemoveAndContinue}
        onBack={() => setBlockingItem(null)}
      />
    </>
  );
}
