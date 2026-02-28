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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/admin/image-uploader";
import { generateSlug, isValidSlug } from "@/lib/utils/slug";
import type { Product, Category } from "@/types";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  slug: z.string().min(1, "El slug es requerido").max(255).refine(isValidSlug, "Solo minúsculas, números y guiones"),
  description: z.string().optional(),
  price: z.number().positive("Debe ser mayor a 0").nullable(),
  stock: z.number().int().min(0),
  category_id: z.string().nullable(),
  is_active: z.boolean(),
  featured: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface ProductFormDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  categories: Category[];
}

export function ProductFormDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
  categories,
}: ProductFormDialogProps) {
  const isEditing = !!product;
  const [manualSlug, setManualSlug] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", slug: "", description: "", price: null,
      stock: 0, category_id: null, is_active: false, featured: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (product) {
        form.reset({
          name: product.name,
          slug: product.slug,
          description: product.description ?? "",
          price: product.price,
          stock: product.stock,
          category_id: product.category_id,
          is_active: product.is_active,
          featured: product.featured ?? false,
        });
        setImages(product.images);
        setManualSlug(true);
      } else {
        form.reset({ name: "", slug: "", description: "", price: null, stock: 0, category_id: null, is_active: false, featured: false });
        setImages([]);
        setManualSlug(false);
      }
    }
  }, [open, product, form]);

  const nameValue = form.watch("name");
  useEffect(() => {
    if (!manualSlug && !isEditing) {
      form.setValue("slug", generateSlug(nameValue), { shouldValidate: !!nameValue });
    }
  }, [nameValue, manualSlug, isEditing, form]);

  function handleClose() {
    onOpenChange(false);
  }

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const url = isEditing ? `/api/products/${product!.id}` : "/api/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, images }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Error al guardar");
        return;
      }
      toast.success(isEditing ? "Producto actualizado" : "Producto creado");
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
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input placeholder="Ej: Mate de calabaza" {...field} /></FormControl>
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
                      placeholder="mate-de-calabaza"
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
                    <Textarea placeholder="Describí el producto..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio <span className="text-gray-400 font-normal">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v === "" ? null : parseFloat(v));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={field.value}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
              <ImageUploader folder="products" images={images} onChange={setImages} />
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
