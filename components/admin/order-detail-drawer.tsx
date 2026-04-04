"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@/types";

const VALID_STATUSES: OrderStatus[] = [
  "pendiente_pago",
  "pago_confirmado",
  "enviado",
  "entregado",
  "cancelado",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pago_confirmado: "Pago confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface OrderDetailDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

export function OrderDetailDrawer({
  order,
  open,
  onClose,
  onStatusChange,
}: OrderDetailDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && order) {
      setSelectedStatus(order.status);
    }
  }, [open, order?.id]);

  if (!order) return null;

  async function handleStatusChange() {
    if (!order) return;

    if (!selectedStatus || selectedStatus === order.status) {
      onClose();
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al actualizar");
        return;
      }

      toast.success("Estado actualizado");
      onStatusChange(order.id, selectedStatus);
      onClose();
    } catch {
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdating(false);
    }
  }

  const priceFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Pedido #{order.order_number}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Información del comprador */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Información del comprador</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Nombre</p>
                <p className="text-gray-900 font-medium">{order.buyer_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="text-gray-900 break-all">{order.buyer_email}</p>
              </div>
              <div>
                <p className="text-gray-500">Teléfono</p>
                <p className="text-gray-900">{order.buyer_phone}</p>
              </div>
            </div>
          </div>

          {/* Fecha y estado */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(order.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado actual</p>
              <div className="mt-1">
                <OrderStatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Productos</h3>
            <div className="space-y-2 border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Producto</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Cant.</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Precio</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(order.order_items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.item_name}</p>
                          {item.variation_label && (
                            <p className="text-xs text-gray-500">{item.variation_label}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-right px-3 py-2 text-gray-900">{item.quantity}</td>
                      <td className="text-right px-3 py-2 text-gray-900">
                        {priceFormatter.format(item.unit_price)}
                      </td>
                      <td className="text-right px-3 py-2 font-medium text-gray-900">
                        {priceFormatter.format(item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-900">Total</span>
            <span className="text-base font-bold text-gray-900">
              {priceFormatter.format(order.total)}
            </span>
          </div>

          {/* Cambiar estado */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Cambiar estado</label>
            <Select value={selectedStatus ?? order.status} onValueChange={(v) => setSelectedStatus(v as OrderStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VALID_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={handleStatusChange}
              disabled={updating || selectedStatus === order.status}
            >
              {updating ? "Actualizando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
