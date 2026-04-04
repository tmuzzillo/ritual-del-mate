import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { ShopConfig } from "@/types";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shop_config")
    .select("key, value");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Transformar array de {key, value} a objeto ShopConfig
  const config = (data ?? []).reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  return NextResponse.json({ data: config as unknown as ShopConfig });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: Partial<ShopConfig>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const updates = Object.entries(body).map(([key, value]) => ({ key, value: String(value) }));

  if (updates.length === 0) {
    return NextResponse.json({ error: "No se proporcionaron campos para actualizar" }, { status: 400 });
  }

  // Upsert cada key-value par
  const { error } = await supabase
    .from("shop_config")
    .upsert(updates, { onConflict: "key" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
