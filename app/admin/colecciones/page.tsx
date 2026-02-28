"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectionTable } from "@/components/admin/collections/collection-table";
import { CollectionFormDialog } from "@/components/admin/collections/collection-form-dialog";
import { DeleteCollectionConfirmDialog } from "@/components/admin/collections/delete-collection-confirm-dialog";
import type { Collection, Product, MateSet } from "@/types";
import type { SelectableItem } from "@/components/admin/collections/multi-selector";

export default function ColeccionesPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [availableProducts, setAvailableProducts] = useState<SelectableItem[]>([]);
  const [availableSets, setAvailableSets] = useState<SelectableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Collection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [collectionsRes, productsRes, setsRes] = await Promise.all([
        fetch("/api/collections?admin=true"),
        fetch("/api/products?admin=true"),
        fetch("/api/sets?admin=true"),
      ]);
      const [collectionsJson, productsJson, setsJson] = await Promise.all([
        collectionsRes.json(),
        productsRes.json(),
        setsRes.json(),
      ]);
      if (!collectionsRes.ok) { toast.error("Error al cargar colecciones"); return; }
      setCollections(collectionsJson.data);
      setAvailableProducts(
        (productsJson.data as Product[]).map((p) => ({
          id: p.id, name: p.name, slug: p.slug, price: p.price, is_active: p.is_active,
        }))
      );
      setAvailableSets(
        (setsJson.data as MateSet[]).map((s) => ({
          id: s.id, name: s.name, slug: s.slug, price: s.price, is_active: s.is_active,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleEdit(collection: Collection) {
    setEditTarget(collection);
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
        <h1 className="text-2xl font-bold text-gray-900">Colecciones</h1>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Nueva colección</span>
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <CollectionTable
          collections={collections}
          loading={loading}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
        />
      </div>

      <CollectionFormDialog
        collection={editTarget}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={fetchData}
        availableProducts={availableProducts}
        availableSets={availableSets}
      />

      <DeleteCollectionConfirmDialog
        collection={deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onSuccess={fetchData}
      />
    </div>
  );
}
