"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { ImageUploader } from "@/components/admin/image-uploader";
import { MultiSelector, type SelectableItem } from "./multi-selector";
import { generateSlug, isValidSlug } from "@/lib/utils/slug";
import type { Collection } from "@/types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  slug: z.string().min(1, "El slug es requerido").max(255).refine(isValidSlug, "Solo minúsculas, números y guiones"),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface CollectionFormDialogProps {
  collection: Collection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableProducts: SelectableItem[];
  availableSets: SelectableItem[];
}

export function CollectionFormDialog({
  collection,
  open,
  onOpenChange,
  onSuccess,
  availableProducts,
  availableSets,
}: CollectionFormDialogProps) {
  const isEditing = !!collection;
  const [manualSlug, setManualSlug] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", description: "", is_active: false },
  });

  useEffect(() => {
    if (open) {
      if (collection) {
        form.reset({
          name: collection.name,
          slug: collection.slug,
          description: collection.description ?? "",
          is_active: collection.is_active,
        });
        setImages(collection.images);
        setSelectedProductIds((collection.products ?? []).map((p) => p.id));
        setSelectedSetIds((collection.sets ?? []).map((s) => s.id));
        setManualSlug(true);
      } else {
        form.reset({ name: "", slug: "", description: "", is_active: false });
        setImages([]);
        setSelectedProductIds([]);
        setSelectedSetIds([]);
        setManualSlug(false);
      }
    }
  }, [open, collection, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!manualSlug && !isEditing) {
      form.setValue("slug", generateSlug(nameValue), { shouldValidate: !!nameValue });
    }
  }, [nameValue, manualSlug, isEditing, form]);

  function handleClose() { onOpenChange(false); }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const url = isEditing ? `/api/collections/${collection!.id}` : "/api/collections";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          images,
          productIds: selectedProductIds,
          setIds: selectedSetIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
        return;
      }
      toast.success(isEditing ? "Colección actualizada" : "Colección creada");
      handleClose();
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar colección" : "Nueva colección"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Colección Otoño" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Slug</FormLabel>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setManualSlug((v) => !v)}
                    >
                      {manualSlug ? "Auto-generar" : "Editar manualmente"}
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      readOnly={!manualSlug}
                      className={!manualSlug ? "bg-gray-50 text-gray-500" : ""}
                      placeholder="coleccion-otono"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción <span className="text-gray-400 font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describí la colección..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Imágenes</FormLabel>
              <ImageUploader folder="collections" images={images} onChange={setImages} />
            </FormItem>

            <FormItem>
              <FormLabel>Productos</FormLabel>
              <MultiSelector
                items={availableProducts}
                selectedIds={selectedProductIds}
                onChange={setSelectedProductIds}
                placeholder="Buscar producto..."
              />
            </FormItem>

            <FormItem>
              <FormLabel>Sets</FormLabel>
              <MultiSelector
                items={availableSets}
                selectedIds={selectedSetIds}
                onChange={setSelectedSetIds}
                placeholder="Buscar set..."
              />
            </FormItem>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Publicada</FormLabel>
                    <p className="text-xs text-gray-500">Visible en el catálogo público</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
