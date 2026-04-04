import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface OrderItemPayload {
  item_type: "product" | "set";
  product_id?: string | null;
  set_id?: string | null;
  variation_id?: string | null;
  item_name: string;
  variation_label?: string | null;
  quantity: number;
  unit_price: number;
}

interface CreateOrderBody {
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  total: number;
  items: OrderItemPayload[];
}

export async function POST(req: NextRequest) {
  let body: CreateOrderBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { buyer_name, buyer_email, buyer_phone, total, items } = body;

  if (!buyer_name || buyer_name.trim().length < 2) {
    return NextResponse.json({ error: "buyer_name es requerido (mínimo 2 caracteres)" }, { status: 400 });
  }
  if (!buyer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer_email)) {
    return NextResponse.json({ error: "buyer_email inválido" }, { status: 400 });
  }
  if (!buyer_phone || buyer_phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "buyer_phone inválido (mínimo 8 dígitos)" }, { status: 400 });
  }
  if (!total || typeof total !== "number" || total <= 0) {
    return NextResponse.json({ error: "total inválido" }, { status: 400 });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items es requerido y debe ser un array no vacío" }, { status: 400 });
  }

  // Usar service role para bypass RLS y llamar al RPC
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc("create_order", {
    p_buyer_name: buyer_name.trim(),
    p_buyer_email: buyer_email.trim().toLowerCase(),
    p_buyer_phone: buyer_phone.trim(),
    p_total: total,
    p_items: items,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // El RPC retorna {error, item_name} cuando hay stock insuficiente
  if (data && typeof data === "object" && "error" in data && data.error === "stock_insuficiente") {
    return NextResponse.json(
      { error: "stock_insuficiente", item_name: data.item_name },
      { status: 409 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = req.nextUrl;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(url.searchParams.get("page_size") ?? "20", 10);
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await supabase
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, total: count, page, page_size: pageSize });
}
