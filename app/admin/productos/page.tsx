"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/products/product-table";
import { ProductFormDialog } from "@/components/admin/products/product-form-dialog";
import { DeleteProductConfirmDialog } from "@/components/admin/products/delete-product-confirm-dialog";
import type { Product, Category } from "@/types";

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products?admin=true"),
        fetch("/api/categories"),
      ]);
      const [productsJson, categoriesJson] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
      ]);
      if (!productsRes.ok) { toast.error("Error al cargar productos"); return; }
      setProducts(productsJson.data);
      setCategories(categoriesJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleEdit(product: Product) {
    setEditTarget(product);
    setFormOpen(true);
  }

  function handleCreate() {
    setEditTarget(null);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditTarget(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo producto</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <ProductTable
          products={products}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      <ProductFormDialog
        product={editTarget}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={fetchData}
        categories={categories}
      />

      <DeleteProductConfirmDialog
        product={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
