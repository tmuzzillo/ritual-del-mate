"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { StopCheckoutModal } from "@/components/shop/stop-checkout-modal";
import { getImageUrl } from "@/lib/utils/image";
import type { CartItem } from "@/types";

const checkoutSchema = z.object({
  buyer_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  buyer_email: z.string().email("Ingresá un email válido"),
  buyer_phone: z
    .string()
    .min(8, "El teléfono debe tener al menos 8 dígitos")
    .regex(/^\+?[\d\s\-().]+$/, "Formato de teléfono inválido"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

interface CheckoutFormProps {
  items: CartItem[];
  totalPrice: number;
  onSuccess: () => void;   // limpia carrito o buynow según el flujo
}

export function CheckoutForm({ items, totalPrice, onSuccess }: CheckoutFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [blockingItem, setBlockingItem] = useState<string | null>(null);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { buyer_name: "", buyer_email: "", buyer_phone: "" },
  });

  async function onSubmit(values: CheckoutFormValues) {
    setSubmitting(true);

    const orderItems = items.map((item) => ({
      item_type: item.item_type,
      product_id: item.item_type === "product" ? item.id : null,
      set_id: item.item_type === "set" ? item.id : null,
      variation_id: item.variation_id ?? null,
      item_name: item.name,
      variation_label: item.variation_label ?? null,
      quantity: item.quantity,
      unit_price: item.price,
    }));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_name: values.buyer_name,
          buyer_email: values.buyer_email,
          buyer_phone: values.buyer_phone,
          total: totalPrice,
          items: orderItems,
        }),
      });

      const json = await res.json();

      if (res.status === 409 && json.error === "stock_insuficiente") {
        setBlockingItem(json.item_name ?? "uno de los productos");
        return;
      }

      if (!res.ok) {
        form.setError("root", { message: json.error ?? "Error al procesar el pedido" });
        return;
      }

      sessionStorage.setItem("rdm_last_order_items", JSON.stringify(items));
      onSuccess();
      router.push(
        `/checkout/confirmation?order_number=${json.order_number}&total=${totalPrice}`
      );
    } catch {
      form.setError("root", { message: "Error de conexión. Intentá de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumen del pedido */}
        <div className="bg-brand-cream rounded-2xl border border-brand-sand p-4">
          <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
            Resumen del pedido
          </h2>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.id}_${item.variation_id ?? "base"}`}
                className="flex items-center gap-3"
              >
                <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-white border border-brand-sand">
                  {item.image && (
                    <Image
                      src={getImageUrl(item.image, 200)}
                      alt={item.name}
                      fill
                      sizes="48px"
                      className="object-contain"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brand-dark line-clamp-1">{item.name}</p>
                  {item.variation_label && (
                    <p className="text-xs text-brand-warm-gray">{item.variation_label}</p>
                  )}
                  <p className="text-xs text-brand-warm-gray">x{item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-brand-orange flex-shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-brand-sand flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-dark">Total</span>
            <span className="text-lg font-bold text-brand-orange">{formatPrice(totalPrice)}</span>
          </div>
        </div>

        {/* Formulario */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="buyer_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-dark font-semibold">Nombre completo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Juan García"
                      {...field}
                      className="border-brand-sand focus-visible:ring-brand-terracotta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buyer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-dark font-semibold">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="juan@ejemplo.com"
                      {...field}
                      className="border-brand-sand focus-visible:ring-brand-terracotta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="buyer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-brand-dark font-semibold">Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+54 9 353 510 4448"
                      {...field}
                      className="border-brand-sand focus-visible:ring-brand-terracotta"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-sm text-red-600 font-medium">
                {form.formState.errors.root.message}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-brand-terracotta hover:bg-brand-terracotta-hover text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-60 mt-2"
            >
              {submitting ? "Procesando..." : "Confirmar pedido"}
            </button>
          </form>
        </Form>
      </div>

      {/* Sin stock — en buynow el usuario simplemente vuelve (no hay "eliminar y continuar") */}
      <StopCheckoutModal
        open={blockingItem !== null}
        itemName={blockingItem ?? ""}
        onRemoveAndContinue={() => setBlockingItem(null)}
        onBack={() => setBlockingItem(null)}
      />
    </>
  );
}
