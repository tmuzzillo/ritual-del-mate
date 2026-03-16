"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductTable, type SortState } from "@/components/admin/products/product-table";
import { ProductFilters, type FilterState } from "@/components/admin/products/product-filters";
import { BatchActionBar } from "@/components/admin/products/batch-action-bar";
import { ProductFormDialog } from "@/components/admin/products/product-form-dialog";
import { DeleteProductConfirmDialog } from "@/components/admin/products/delete-product-confirm-dialog";
import type { Product, Category } from "@/types";

const DEFAULT_FILTERS: FilterState = { search: "", categoryId: null, status: "all" };
const DEFAULT_SORT: SortState = { field: null, dir: "asc" };

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const filteredProducts = useMemo(() => {
    const q = filters.search.toLowerCase();
    return products
      .filter((p) => {
        if (q && !p.name.toLowerCase().includes(q)) return false;
        if (filters.categoryId && p.category?.id !== filters.categoryId) return false;
        if (filters.status === "active" && !p.is_active) return false;
        if (filters.status === "inactive" && p.is_active) return false;
        return true;
      })
      .sort((a, b) => {
        if (!sort.field) return 0;
        const mul = sort.dir === "asc" ? 1 : -1;
        switch (sort.field) {
          case "name": return mul * a.name.localeCompare(b.name, "es");
          case "price": return mul * ((a.price ?? -1) - (b.price ?? -1));
          case "category":
            return mul * (a.category?.name ?? "").localeCompare(b.category?.name ?? "", "es");
          case "status": return mul * (Number(a.is_active) - Number(b.is_active));
          default: return 0;
        }
      });
  }, [products, filters, sort]);

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

  function handleSuccess() {
    setSelectedIds(new Set());
    fetchData();
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
        <ProductFilters
          categories={categories}
          filters={filters}
          onFiltersChange={setFilters}
          totalCount={products.length}
          filteredCount={filteredProducts.length}
        />
        <ProductTable
          products={filteredProducts}
          loading={loading}
          selectedIds={selectedIds}
          sort={sort}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onSelectionChange={setSelectedIds}
          onSortChange={setSort}
        />
      </div>

      <BatchActionBar
        selectedIds={selectedIds}
        products={products}
        categories={categories}
        onClearSelection={() => setSelectedIds(new Set())}
        onSuccess={handleSuccess}
      />

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
