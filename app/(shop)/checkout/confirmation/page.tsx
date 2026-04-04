import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/shop/order-confirmation";
import type { ShopConfig } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido confirmado · Ritual del Mate",
};

interface Props {
  searchParams: Promise<{
    order_number?: string;
    total?: string;
    order_id?: string;
  }>;
}

async function getShopConfig(): Promise<ShopConfig> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/shop-config`, {
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Error al cargar configuración");

    const json = await res.json();
    const data = json.data as ShopConfig;
    // Safeguard: si el número no está configurado usar el default
    if (!data.whatsapp_number) data.whatsapp_number = "543535104448";
    return data;
  } catch {
    // Fallback seguro si la config no está disponible
    return {
      bank_cbu: "",
      bank_alias: "",
      bank_owner: "",
      bank_name: "",
      whatsapp_number: "543535104448",
      shipping_disclaimer: "Te contactaremos para coordinar el envío.",
    };
  }
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const params = await searchParams;
  const orderNumber = parseInt(params.order_number ?? "", 10);
  const total = parseFloat(params.total ?? "");

  if (!orderNumber || isNaN(orderNumber) || !total || isNaN(total)) {
    notFound();
  }

  const config = await getShopConfig();

  return <OrderConfirmation orderNumber={orderNumber} total={total} config={config} />;
}
