"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SetTable } from "@/components/admin/sets/set-table";
import { SetFormDialog } from "@/components/admin/sets/set-form-dialog";
import { DeleteSetConfirmDialog } from "@/components/admin/sets/delete-set-confirm-dialog";
import type { MateSet, Category } from "@/types";

export default function SetsPage() {
  const [sets, setSets] = useState<MateSet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MateSet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MateSet | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [setsRes, categoriesRes] = await Promise.all([
        fetch("/api/sets?admin=true"),
        fetch("/api/categories"),
      ]);
      const [setsJson, categoriesJson] = await Promise.all([
        setsRes.json(),
        categoriesRes.json(),
      ]);
      if (!setsRes.ok) { toast.error("Error al cargar sets"); return; }
      setSets(setsJson.data);
      setCategories(categoriesJson.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleEdit(set: MateSet) {
    setEditTarget(set);
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
        <h1 className="text-2xl font-bold text-gray-900">Sets y combos</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nuevo set</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <SetTable
          sets={sets}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      <SetFormDialog
        set={editTarget}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={fetchData}
        categories={categories}
      />

      <DeleteSetConfirmDialog
        set={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
