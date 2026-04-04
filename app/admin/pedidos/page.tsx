"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrdersTable } from "@/components/admin/orders-table";
import { OrderDetailDrawer } from "@/components/admin/order-detail-drawer";
import type { Order, OrderStatus } from "@/types";

type FilterStatus = "all" | OrderStatus;

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) {
        toast.error("Error al cargar pedidos");
        return;
      }
      const json = await res.json();
      setOrders(json.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((o) => o.status === filterStatus);

  function handleViewDetails(order: Order) {
    setSelectedOrder(order);
    setDrawerOpen(true);
  }

  function handleStatusChange(id: string, newStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
    if (selectedOrder && selectedOrder.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filtrar por estado:</label>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente_pago">Pendiente de pago</SelectItem>
              <SelectItem value="pago_confirmado">Pago confirmado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <OrdersTable
          orders={filteredOrders}
          loading={loading}
          onStatusChange={handleStatusChange}
          onViewDetails={handleViewDetails}
        />
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
