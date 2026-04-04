"use client";

import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./order-status-badge";
import type { Order, OrderStatus } from "@/types";

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
}

export function OrdersTable({
  orders,
  loading,
  onViewDetails,
}: OrdersTableProps) {
  const priceFormatter = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Cargando pedidos...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No hay pedidos
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Nº Pedido</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Fecha</th>
            <th className="text-left px-4 py-3 font-semibold text-gray-700">Comprador</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Total</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-700">Estado</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <span className="font-medium text-gray-900">#{order.order_number}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(order.created_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-900">{order.buyer_name}</p>
                  <p className="text-xs text-gray-500">{order.buyer_email}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-medium text-gray-900">
                {priceFormatter.format(order.total)}
              </td>
              <td className="px-4 py-3 text-center">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(order)}
                  className="text-xs"
                >
                  Ver detalle
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
