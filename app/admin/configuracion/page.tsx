"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShopConfigForm } from "@/components/admin/shop-config-form";
import type { ShopConfig } from "@/types";

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      setLoading(true);
      try {
        const res = await fetch("/api/shop-config");
        if (!res.ok) {
          toast.error("Error al cargar configuración");
          return;
        }
        const json = await res.json();
        setConfig(json.data);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Cargando configuración...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Error al cargar la configuración</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración de tienda</h1>
        <p className="text-sm text-gray-500 mt-1">
          Actualiza los datos bancarios, contacto y políticas de envío
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ShopConfigForm initialValues={config} />
      </div>
    </div>
  );
}
