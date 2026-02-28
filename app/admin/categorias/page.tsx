"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTable, type CategoryWithCount } from "@/components/admin/categories/category-table";
import { CreateCategoryDialog } from "@/components/admin/categories/create-category-dialog";
import { EditCategoryDialog } from "@/components/admin/categories/edit-category-dialog";
import { DeleteCategoryConfirmDialog } from "@/components/admin/categories/delete-category-confirm-dialog";

export default function CategoriasPage() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryWithCount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!res.ok) {
        toast.error("Error al cargar categorías");
        return;
      }
      setCategories(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nueva categoría</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <CategoryTable
          categories={categories}
          loading={loading}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      <CreateCategoryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchCategories}
      />

      <EditCategoryDialog
        category={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        onSuccess={fetchCategories}
      />

      <DeleteCategoryConfirmDialog
        category={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={fetchCategories}
      />
    </div>
  );
}
