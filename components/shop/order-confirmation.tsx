"use client";

import { useEffect, useState } from "react";
import type { CartItem, ShopConfig } from "@/types";

interface OrderConfirmationProps {
  orderNumber: number;
  total: number;
  config: ShopConfig;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
}

function buildItemLine(item: CartItem): string {
  const qty = item.quantity > 1 ? `${item.quantity}x ` : "";
  if (item.item_type === "set" && item.components && item.components.length > 0) {
    return `${qty}${item.name} (incluye: ${item.components.join(", ")})`;
  }
  if (item.variation_label) {
    return `${qty}${item.name} (${item.variation_label})`;
  }
  return `${qty}${item.name}`;
}

export function OrderConfirmation({ orderNumber, total, config }: OrderConfirmationProps) {
  const formattedTotal = formatPrice(total);
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rdm_last_order_items");
      if (raw) setOrderItems(JSON.parse(raw));
    } catch {
      // noop
    }
  }, []);

  const detailLines =
    orderItems.length > 0
      ? "\n\nDetalle:\n" + orderItems.map((i) => `- ${buildItemLine(i)}`).join("\n")
      : "";

  const waMessage = encodeURIComponent(
    `Hola! Acabo de realizar el pedido #${orderNumber} por ${formattedTotal}.${detailLines}\n\nTe envío el comprobante de la transferencia.`
  );
  const waUrl = `https://wa.me/${config.whatsapp_number}?text=${waMessage}`;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <div className="text-4xl">🧉</div>
        <h1 className="text-2xl font-extrabold text-brand-dark">¡Pedido recibido!</h1>
        <p className="text-brand-warm-gray text-sm">
          Gracias por tu compra. Te esperamos para coordinar el envío.
        </p>
      </div>

      {/* Número de pedido */}
      <div className="bg-brand-terracotta text-white rounded-2xl px-6 py-5 text-center">
        <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">
          Número de pedido
        </p>
        <p className="text-4xl font-extrabold mt-1">#{orderNumber}</p>
        <p className="text-sm opacity-80 mt-1">Total: {formattedTotal}</p>
      </div>

      {/* Datos bancarios */}
      <div className="bg-brand-cream rounded-2xl border border-brand-sand p-5 space-y-3">
        <h2 className="text-sm font-bold text-brand-dark uppercase tracking-wide">
          Datos para la transferencia
        </h2>
        <div className="space-y-2">
          <DataRow label="Banco" value={config.bank_name} />
          <DataRow label="Titular" value={config.bank_owner} />
          <DataRow label="CBU" value={config.bank_cbu} />
          <DataRow label="Alias" value={config.bank_alias} />
          <DataRow label="Monto" value={formattedTotal} highlight />
        </div>
      </div>

      {/* Disclaimer de envío */}
      {config.shipping_disclaimer && (
        <div className="bg-white rounded-2xl border border-brand-sand p-4">
          <p className="text-sm text-brand-brown leading-relaxed">{config.shipping_disclaimer}</p>
        </div>
      )}

      {/* CTA WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6
                   bg-brand-terracotta hover:bg-brand-terracotta-hover text-white
                   font-semibold rounded-xl transition-colors text-sm"
      >
        Enviar comprobante por WhatsApp <span aria-hidden="true">→</span>
      </a>

      <p className="text-center text-xs text-brand-warm-gray">
        Una vez confirmado el pago, coordinaremos el envío a tu domicilio.
      </p>
    </div>
  );
}

function DataRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-brand-warm-gray uppercase tracking-wide flex-shrink-0">
        {label}
      </span>
      <span
        className={`text-sm font-semibold text-right ${
          highlight ? "text-brand-terracotta text-base font-bold" : "text-brand-dark"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
