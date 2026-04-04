"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { CartItemRow } from "@/components/shop/cart-item-row";
import { StopCheckoutModal } from "@/components/shop/stop-checkout-modal";
import { useCart } from "@/components/shop/cart-provider";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const router = useRouter();
  const [blockingItem, setBlockingItem] = useState<{
    name: string;
    id: string;
    variationId?: string;
  } | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);

  async function handleGoToCheckout() {
    if (items.length === 0) return;
    setCheckingStock(true);

    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

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
            setBlockingItem({ name: cartItem.name, id: cartItem.id });
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

      router.push("/checkout");
    } catch {
      router.push("/checkout");
    } finally {
      setCheckingStock(false);
    }
  }

  function handleRemoveAndContinue() {
    if (!blockingItem) return;
    removeItem(blockingItem.id, blockingItem.variationId);
    setBlockingItem(null);
    router.push("/checkout");
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Tu carrito</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-brand-warm-gray text-base">Tu carrito está vacío</p>
          <Link
            href="/catalogo"
            className="inline-block text-brand-terracotta font-semibold hover:underline text-sm"
          >
            Ir al catálogo
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-brand-sand px-4 py-2 mb-6">
            {items.map((item) => (
              <CartItemRow
                key={`${item.id}_${item.variation_id ?? "base"}`}
                item={item}
                onUpdateQty={(qty) => updateQuantity(item.id, qty, item.variation_id)}
                onRemove={() => removeItem(item.id, item.variation_id)}
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-brand-sand px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-base font-semibold text-brand-dark">Total</span>
              <span className="text-xl font-bold text-brand-orange">{formatPrice(totalPrice)}</span>
            </div>
            <button
              onClick={handleGoToCheckout}
              disabled={checkingStock}
              className="w-full py-3.5 px-6 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-60"
            >
              {checkingStock ? "Verificando stock..." : "Ir al checkout"}
            </button>
            <Link
              href="/catalogo"
              className="block text-center text-sm font-semibold text-brand-dark hover:text-brand-terracotta transition-colors"
            >
              Seguir comprando
            </Link>
          </div>
        </>
      )}

      <StopCheckoutModal
        open={blockingItem !== null}
        itemName={blockingItem?.name ?? ""}
        onRemoveAndContinue={handleRemoveAndContinue}
        onBack={() => setBlockingItem(null)}
      />
    </div>
  );
}
