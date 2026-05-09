"use client";

import { useState } from "react";
import Link from "next/link";
import { Gift, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageGallery } from "@/components/shop/image-gallery";
import { useCart } from "@/components/shop/cart-provider";
import { isSetAvailable } from "@/lib/utils/stock";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { MateSet, SetItem } from "@/types";

const BUYNOW_KEY = "rdm_buynow";

interface SetDetailClientProps {
  set: MateSet & { set_items: SetItem[] };
  activeItems: SetItem[];
  formatted: string;
}

export function SetDetailClient({ set, activeItems, formatted }: SetDetailClientProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const available = isSetAvailable(set.set_items);
  const [quantity, setQuantity] = useState(1);

  // Stock máximo del set = mínimo de (floor(stock_item / qty_requerida)) entre todos los items
  const maxStock = available
    ? Math.max(
        1,
        Math.min(
          ...set.set_items.map((si) => {
            const s = si.variation
              ? (si.variation as { stock?: number }).stock ?? 0
              : si.product?.stock ?? 0;
            return Math.floor(s / (si.quantity || 1));
          })
        )
      )
    : 0;

  function buildCartItem() {
    return {
      id: set.id,
      item_type: "set" as const,
      name: set.name,
      image: set.images[0] ?? "",
      price: set.price,
      quantity,
      components: activeItems.map((si) =>
        si.product
          ? `${si.product.name}${si.variation ? ` (${si.variation.label})` : ""}`
          : "Producto"
      ),
    };
  }

  function handleAddToCart() {
    if (!available) return;
    addItem(buildCartItem());
    toast.success(`¡${quantity > 1 ? `${quantity}x ` : ""}${set.name} agregado al carrito!`);
  }

  function handleBuyNow() {
    if (!available) return;
    sessionStorage.setItem(BUYNOW_KEY, JSON.stringify([buildCartItem()]));
    router.push("/checkout?source=buynow");
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
      {/* Columna izquierda: galería + detalle de items del set */}
      <div className="space-y-4">
        <ImageGallery images={set.images} name={set.name} />

        {activeItems.length > 0 && (
          <div className="border-t border-brand-sand pt-4">
            <h2 className="text-xs font-semibold text-brand-dark mb-3 uppercase tracking-wide">
              Detalles del Set
            </h2>
            <ul className="space-y-2.5">
              {activeItems.map((si) => (
                <li key={si.id} className="flex items-center gap-3 text-sm text-brand-brown">
                  {si.is_gift ? (
                    <Gift className="flex-shrink-0 h-4 w-4 text-brand-orange" />
                  ) : (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-sand text-brand-dark font-bold text-xs flex items-center justify-center">
                      {si.quantity}
                    </span>
                  )}
                  <div>
                    {si.product ? (
                      <Link
                        href={`/producto/${si.product.slug}`}
                        className="font-medium hover:text-brand-dark transition-colors"
                      >
                        {si.product.name}
                        {si.is_gift && (
                          <span className="ml-1.5 text-xs text-brand-orange font-semibold">· de regalo</span>
                        )}
                      </Link>
                    ) : (
                      <span className="font-medium">Producto</span>
                    )}
                    {si.variation && (
                      <span className="block text-xs text-brand-brown opacity-60">{si.variation.label}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Columna derecha: info + acciones */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold text-brand-olive uppercase tracking-wide">Set</span>

        <h1 className="text-3xl font-extrabold text-brand-dark leading-tight">{set.name}</h1>

        <p className="text-2xl font-bold text-brand-orange">{formatted}</p>

        {set.description && (
          <p className="text-brand-brown leading-relaxed whitespace-pre-wrap">{set.description}</p>
        )}

        {/* Selector de cantidad */}
        {available && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-brand-dark">Cantidad</span>
            <div className="flex items-center border border-brand-sand rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="px-3 py-2 text-brand-dark hover:bg-brand-cream transition-colors disabled:opacity-30"
                aria-label="Reducir cantidad"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="px-4 py-2 text-sm font-bold text-brand-dark min-w-[2.5rem] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                disabled={quantity >= maxStock}
                className="px-3 py-2 text-brand-dark hover:bg-brand-cream transition-colors disabled:opacity-30"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {maxStock <= 5 && (
              <span className="text-xs text-brand-warm-gray">
                ({maxStock} disponible{maxStock !== 1 ? "s" : ""})
              </span>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={handleBuyNow}
            disabled={!available}
            className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 font-semibold rounded-xl transition-colors text-sm ${
              available
                ? "bg-brand-terracotta hover:bg-brand-terracotta-hover text-white cursor-pointer"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {available ? "Comprar ahora" : "Sin stock"}
          </button>

          {available && (
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 font-semibold rounded-xl border-2 border-brand-terracotta text-brand-terracotta hover:bg-brand-terracotta hover:text-white transition-colors text-sm cursor-pointer"
            >
              Agregar al carrito
            </button>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="envios" className="border-brand-sand">
            <AccordionTrigger className="text-sm font-semibold text-brand-dark hover:text-brand-orange hover:no-underline">
              Envíos y consultas
            </AccordionTrigger>
            <AccordionContent className="text-sm text-brand-brown leading-relaxed">
              Realizamos envíos a todo el país por Andreani o correo argentino. Una vez que
              confirmás tu compra, coordinamos el envío por WhatsApp. Los tiempos de entrega
              varían según la localidad.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
