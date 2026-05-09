"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { ProductSelector, type SelectedItem } from "./product-selector";
import { generateSlug, isValidSlug } from "@/lib/utils/slug";
import type { MateSet, Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  slug: z.string().min(1, "El slug es requerido").max(255).refine(isValidSlug, "Solo minúsculas, números y guiones"),
  description: z.string().optional(),
  badge_text: z.string().max(60).optional().nullable(),
  price: z.number().positive("Debe ser mayor a 0"),
  category_id: z.string().nullable(),
  is_active: z.boolean(),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface SetFormDialogProps {
  set: MateSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Category[];
}

export function SetFormDialog({
  set,
  open,
  onOpenChange,
  onSuccess,
  categories,
}: SetFormDialogProps) {
  const isEditing = !!set;
  const [manualSlug, setManualSlug] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", slug: "", description: "", badge_text: null, price: undefined,
      category_id: null, is_active: false, featured: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (set) {
        form.reset({
          name: set.name,
          slug: set.slug,
          description: set.description ?? "",
          badge_text: set.badge_text ?? null,
          price: set.price,
          category_id: set.category_id,
          is_active: set.is_active,
          featured: set.featured ?? false,
        });
        setImages(set.images);
        setItems(
          (set.set_items ?? []).map((si) => ({
            product_id: si.product_id,
            quantity: si.quantity,
            product: si.product!,
            variation_id: si.variation_id ?? null,
            variation: si.variation ?? null,
            is_gift: si.is_gift ?? false,
          }))
        );
        setManualSlug(true);
      } else {
        form.reset({ name: "", slug: "", description: "", badge_text: null, price: undefined, category_id: null, is_active: false, featured: false });
        setImages([]);
        setItems([]);
        setManualSlug(false);
      }
    }
  }, [open, set, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!manualSlug && !isEditing) {
      form.setValue("slug", generateSlug(nameValue), { shouldValidate: !!nameValue });
    }
  }, [nameValue, manualSlug, isEditing, form]);

  function getOutOfStockItems() {
    return items.filter((item) => {
      const stock = item.variation ? item.variation.stock : item.product.stock;
      return stock <= 0;
    });
  }

  function handleClose() { onOpenChange(false); }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const url = isEditing ? `/api/sets/${set!.id}` : "/api/sets";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          badge_text: values.badge_text || null,
          images,
          items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, variation_id: i.variation_id ?? null, is_gift: i.is_gift })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
        return;
      }
      toast.success(isEditing ? "Set actualizado" : "Set creado");
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
          <DialogTitle>{isEditing ? "Editar set" : "Nuevo set"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Kit de iniciación" {...field} /></FormControl>
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
                      placeholder="kit-de-iniciacion"
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
                    <Textarea placeholder="Describí el set..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="badge_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto destacado <span className="text-gray-400 font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: Incluye yerba de regalo"
                      maxLength={60}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-400">Se muestra como badge sobre la imagen de la card. Máx. 60 caracteres.</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^0-9]/g, "");
                        field.onChange(v === "" ? undefined : Number(v));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría <span className="text-gray-400 font-normal">(opcional)</span></FormLabel>
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Imágenes</FormLabel>
              <ImageUploader folder="sets" images={images} onChange={setImages} />
            </FormItem>

            <FormItem>
              <FormLabel>Productos del set</FormLabel>
              <ProductSelector selected={items} onChange={setItems} />
              {items.length > 0 && (() => {
                const outOfStock = getOutOfStockItems();
                if (outOfStock.length === 0) {
                  return (
                    <div className="mt-2 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-green-700 font-medium">Todos los productos tienen stock</span>
                    </div>
                  );
                }
                return (
                  <div className="mt-2 flex gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm text-red-700 font-medium">Sin stock:</span>
                      <ul className="mt-1 space-y-0.5">
                        {outOfStock.map((item) => (
                          <li key={`${item.product_id}-${item.variation_id ?? "base"}`} className="text-sm text-red-600">
                            {item.product.name}{item.variation ? ` · ${item.variation.label}` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </FormItem>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Publicado</FormLabel>
                    <p className="text-xs text-gray-500">Visible en el catálogo público</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="featured"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                  <div>
                    <FormLabel className="cursor-pointer">Destacado en home</FormLabel>
                    <p className="text-xs text-gray-500">Aparece en la sección de destacados de la home</p>
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
