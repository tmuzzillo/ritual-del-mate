"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/components/shop/cart-provider";

interface CartButtonProps {
  onOpen: () => void;
}

export function CartButton({ onOpen }: CartButtonProps) {
  const { totalItems } = useCart();

  return (
    <button
      onClick={onOpen}
      aria-label={`Carrito${totalItems > 0 ? ` (${totalItems} items)` : ""}`}
      className="relative p-1 text-brand-dark hover:text-brand-terracotta transition-colors"
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-terracotta text-white text-[10px] font-bold leading-none">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
}
