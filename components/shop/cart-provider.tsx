"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { CartItem } from "@/types";

const CART_KEY = "rdm_cart";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, variationId?: string) => void;
  updateQuantity: (id: string, qty: number, variationId?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(id: string, variationId?: string): string {
  return `${id}_${variationId ?? "base"}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage solo en el cliente
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        setItems(JSON.parse(stored) as CartItem[]);
      }
    } catch {
      // localStorage corrupto, ignorar
    }
    setHydrated(true);
  }, []);

  // Persistir en localStorage cada vez que cambia el carrito (después de hidratar)
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const key = itemKey(newItem.id, newItem.variation_id);
      const existing = prev.find(
        (i) => itemKey(i.id, i.variation_id) === key
      );
      if (existing) {
        return prev.map((i) =>
          itemKey(i.id, i.variation_id) === key
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((id: string, variationId?: string) => {
    const key = itemKey(id, variationId);
    setItems((prev) =>
      prev.filter((i) => itemKey(i.id, i.variation_id) !== key)
    );
  }, []);

  const updateQuantity = useCallback(
    (id: string, qty: number, variationId?: string) => {
      const key = itemKey(id, variationId);
      if (qty <= 0) {
        setItems((prev) =>
          prev.filter((i) => itemKey(i.id, i.variation_id) !== key)
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.id, i.variation_id) === key ? { ...i, quantity: qty } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>");
  }
  return ctx;
}
