"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "@/components/shop/checkout-form";
import { useCart } from "@/components/shop/cart-provider";
import type { CartItem } from "@/types";

const BUYNOW_KEY = "rdm_buynow";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get("source") === "buynow";

  const { items: cartItems, clearCart } = useCart();
  const router = useRouter();

  const [buyNowItems, setBuyNowItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  // Evita que al vaciar el carrito tras confirmar el pedido se redirija a /carrito
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (isBuyNow) {
      try {
        const raw = sessionStorage.getItem(BUYNOW_KEY);
        const parsed: CartItem[] = raw ? JSON.parse(raw) : [];
        if (parsed.length === 0) {
          router.replace("/catalogo");
          return;
        }
        setBuyNowItems(parsed);
      } catch {
        router.replace("/catalogo");
        return;
      }
    } else {
      if (cartItems.length === 0 && !confirmedRef.current) {
        router.replace("/carrito");
        return;
      }
    }
    setReady(true);
  }, [isBuyNow, cartItems, router]);

  if (!ready) return null;

  const items = isBuyNow ? buyNowItems : cartItems;
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  function handleSuccess() {
    confirmedRef.current = true;
    if (isBuyNow) {
      sessionStorage.removeItem(BUYNOW_KEY);
    } else {
      clearCart();
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href={isBuyNow ? "/catalogo" : "/carrito"}
        className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-6 inline-block"
      >
        {isBuyNow ? "← Seguir comprando" : "← Volver al carrito"}
      </Link>

      <h1 className="text-2xl font-extrabold text-brand-dark mb-6">Finalizar compra</h1>

      <CheckoutForm
        items={items}
        totalPrice={totalPrice}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
