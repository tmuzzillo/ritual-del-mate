"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ShopConfig } from "@/types";

const schema = z.object({
  bank_cbu: z.string().min(1, "El CBU es requerido"),
  bank_alias: z.string().min(1, "El alias es requerido"),
  bank_owner: z.string().min(1, "El titular es requerido"),
  bank_name: z.string().min(1, "El banco es requerido"),
  whatsapp_number: z.string()
    .min(1, "El número es requerido")
    .regex(/^\d+$/, "Solo números, sin + ni espacios"),
  shipping_disclaimer: z.string()
    .min(10, "Mínimo 10 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
});

type FormValues = z.infer<typeof schema>;

interface ShopConfigFormProps {
  initialValues: ShopConfig;
}

export function ShopConfigForm({ initialValues }: ShopConfigFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bank_cbu: initialValues.bank_cbu,
      bank_alias: initialValues.bank_alias,
      bank_owner: initialValues.bank_owner,
      bank_name: initialValues.bank_name,
      whatsapp_number: initialValues.whatsapp_number,
      shipping_disclaimer: initialValues.shipping_disclaimer,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch("/api/shop-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Error al guardar");
        return;
      }

      toast.success("Configuración actualizada");
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos bancarios */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos bancarios</h3>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="bank_cbu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CBU</FormLabel>
                  <FormControl>
                    <Input placeholder="0000000000000000000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_alias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alias</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: RITUAL.DEL.MATE" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_owner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titular</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del titular" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Banco de la Nación Argentina" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* WhatsApp y envío */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto y envío</h3>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="whatsapp_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de WhatsApp</FormLabel>
                  <FormControl>
                    <Input placeholder="543535104448" {...field} />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    Solo números, sin + ni espacios. Ej: 543535104448
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shipping_disclaimer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aclaración sobre envío</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describí cómo es el proceso de envío, costos, tiempos de entrega, etc."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500 mt-1">
                    {field.value?.length ?? 0}/1000 caracteres
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>


        {/* Botones */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => form.reset()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
