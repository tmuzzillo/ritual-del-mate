"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
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
import type { Product, Category, ProductVariation } from "@/types";

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

  // Variations state
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [variationsLoading, setVariationsLoading] = useState(false);
  const [newVariation, setNewVariation] = useState<{ label: string; images: string[] } | null>(null);
  const [editingVariation, setEditingVariation] = useState<{ id: string; label: string; images: string[] } | null>(null);
  const [variationError, setVariationError] = useState<string | null>(null);
  const [savingVariation, setSavingVariation] = useState(false);

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
        // Load variations
        setVariationsLoading(true);
        setVariationError(null);
        fetch(`/api/products/${product.id}/variations`)
          .then(r => r.json())
          .then(d => setVariations(d.data ?? []))
          .catch(() => setVariationError("Error al cargar variaciones"))
          .finally(() => setVariationsLoading(false));
      } else {
        form.reset({ name: "", slug: "", description: "", price: null, stock: 0, category_id: null, is_active: false, featured: false });
        setImages([]);
        setManualSlug(false);
        setVariations([]);
      }
      setNewVariation(null);
      setEditingVariation(null);
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

  async function handleSaveNewVariation() {
    if (!newVariation || !product?.id) return;
    if (!newVariation.label.trim()) {
      setVariationError("El label es obligatorio");
      return;
    }
    setSavingVariation(true);
    setVariationError(null);
    try {
      const res = await fetch(`/api/products/${product.id}/variations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newVariation.label.trim(), images: newVariation.images, sort_order: variations.length }),
      });
      const json = await res.json();
      if (!res.ok) { setVariationError(json.error ?? "Error al guardar"); return; }
      setVariations(prev => [...prev, json.data]);
      setNewVariation(null);
      toast.success("Variación agregada");
    } catch {
      setVariationError("Error al guardar la variación");
    } finally {
      setSavingVariation(false);
    }
  }

  async function handleSaveEditVariation() {
    if (!editingVariation) return;
    if (!editingVariation.label.trim()) {
      setVariationError("El label es obligatorio");
      return;
    }
    setSavingVariation(true);
    setVariationError(null);
    try {
      const res = await fetch(`/api/variations/${editingVariation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editingVariation.label.trim(), images: editingVariation.images }),
      });
      const json = await res.json();
      if (!res.ok) { setVariationError(json.error ?? "Error al guardar"); return; }
      setVariations(prev => prev.map(v => v.id === editingVariation.id ? json.data : v));
      setEditingVariation(null);
      toast.success("Variación actualizada");
    } catch {
      setVariationError("Error al actualizar la variación");
    } finally {
      setSavingVariation(false);
    }
  }

  async function handleToggleVariation(v: ProductVariation) {
    try {
      const res = await fetch(`/api/variations/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !v.is_active }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Error"); return; }
      setVariations(prev => prev.map(x => x.id === v.id ? json.data : x));
    } catch {
      toast.error("Error al actualizar la variación");
    }
  }

  async function handleDeleteVariation(v: ProductVariation) {
    if (!confirm(`¿Eliminar la variación "${v.label}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/variations/${v.id}`, { method: "DELETE" });
      if (res.status === 409) {
        const json = await res.json();
        toast.error(json.error);
        return;
      }
      if (!res.ok) { toast.error("Error al eliminar"); return; }
      setVariations(prev => prev.filter(x => x.id !== v.id));
      toast.success(`Variación "${v.label}" eliminada`);
    } catch {
      toast.error("Error al eliminar la variación");
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
              <FormLabel>Imágenes del producto</FormLabel>
              <ImageUploader folder="products" images={images} onChange={setImages} />
            </FormItem>

            {/* Variaciones — solo disponibles al editar un producto existente */}
            {isEditing && (
              <div className="space-y-3 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Variaciones</FormLabel>
                  {!newVariation && !editingVariation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => { setNewVariation({ label: "", images: [] }); setVariationError(null); }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Agregar
                    </Button>
                  )}
                </div>

                {variationsLoading && <p className="text-xs text-gray-400">Cargando variaciones...</p>}

                {/* Lista de variaciones existentes */}
                {variations.length > 0 && (
                  <ul className="space-y-2">
                    {variations.map((v) => (
                      <li key={v.id} className="border border-gray-100 rounded-md overflow-hidden">
                        {editingVariation?.id === v.id ? (
                          // Inline edit form
                          <div className="p-2 space-y-2 bg-gray-50">
                            <Input
                              placeholder="Label (ej: Rojo)"
                              value={editingVariation.label}
                              onChange={e => setEditingVariation(prev => prev ? { ...prev, label: e.target.value } : null)}
                              className="h-8 text-sm"
                            />
                            <ImageUploader
                              folder="variations"
                              images={editingVariation.images}
                              onChange={imgs => setEditingVariation(prev => prev ? { ...prev, images: imgs } : null)}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                                onClick={() => { setEditingVariation(null); setVariationError(null); }}>
                                <X className="h-3 w-3 mr-1" /> Cancelar
                              </Button>
                              <Button type="button" size="sm" className="h-7 text-xs"
                                disabled={savingVariation} onClick={handleSaveEditVariation}>
                                <Check className="h-3 w-3 mr-1" /> {savingVariation ? "Guardando..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Row de variación
                          <div className="flex items-center gap-2 p-2">
                            <div className="relative w-10 h-10 flex-shrink-0 rounded bg-brand-cream overflow-hidden">
                              {v.images[0] ? (
                                <Image src={v.images[0]} alt={v.label} fill className="object-contain" sizes="40px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <span className="text-gray-300 text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <span className={`flex-1 text-sm truncate ${!v.is_active ? "text-gray-400 line-through" : ""}`}>
                              {v.label}
                            </span>
                            <Switch
                              checked={v.is_active}
                              onCheckedChange={() => handleToggleVariation(v)}
                              className="scale-75"
                            />
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0"
                              onClick={() => { setEditingVariation({ id: v.id, label: v.label, images: v.images }); setVariationError(null); }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteVariation(v)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Form nueva variación */}
                {newVariation && (
                  <div className="border border-dashed border-gray-300 rounded-md p-2 space-y-2 bg-gray-50">
                    <Input
                      placeholder="Label (ej: Rojo, Perro, Verde)"
                      value={newVariation.label}
                      onChange={e => setNewVariation(prev => prev ? { ...prev, label: e.target.value } : null)}
                      className="h-8 text-sm"
                    />
                    <ImageUploader
                      folder="variations"
                      images={newVariation.images}
                      onChange={imgs => setNewVariation(prev => prev ? { ...prev, images: imgs } : null)}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs"
                        onClick={() => { setNewVariation(null); setVariationError(null); }}>
                        <X className="h-3 w-3 mr-1" /> Cancelar
                      </Button>
                      <Button type="button" size="sm" className="h-7 text-xs"
                        disabled={savingVariation} onClick={handleSaveNewVariation}>
                        <Check className="h-3 w-3 mr-1" /> {savingVariation ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
                  </div>
                )}

                {variations.length === 0 && !variationsLoading && !newVariation && (
                  <p className="text-xs text-gray-400">Sin variaciones. Agregá una si el producto tiene opciones de color, diseño, etc.</p>
                )}

                {variationError && <p className="text-xs text-red-600">{variationError}</p>}
              </div>
            )}

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
