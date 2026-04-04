import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@/types";

type Params = { params: Promise<{ id: string }> };

const VALID_STATUSES: OrderStatus[] = [
  "pendiente_pago",
  "pago_confirmado",
  "enviado",
  "entregado",
  "cancelado",
];

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  let body: { status?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json(
      { error: "El estado debe ser uno de: pendiente_pago, pago_confirmado, enviado, entregado, cancelado" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status: status as OrderStatus })
    .eq("id", id)
    .select("*, order_items(*)")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Pedido no encontrado" },
      { status: error ? 500 : 404 }
    );
  }

  return NextResponse.json({ data });
}
