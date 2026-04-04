"use client";

import type { OrderStatus } from "@/types";

const STATUS_CONFIG: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pendiente_pago: { bg: "bg-amber-100", text: "text-amber-800", label: "Pendiente de pago" },
  pago_confirmado: { bg: "bg-blue-100", text: "text-blue-800", label: "Pago confirmado" },
  enviado: { bg: "bg-purple-100", text: "text-purple-800", label: "Enviado" },
  entregado: { bg: "bg-green-100", text: "text-green-800", label: "Entregado" },
  cancelado: { bg: "bg-red-100", text: "text-red-800", label: "Cancelado" },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
