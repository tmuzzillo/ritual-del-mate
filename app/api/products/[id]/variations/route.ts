import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from("product_variations")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { label, images, sort_order, is_default } = await req.json();

  if (!label?.trim()) {
    return NextResponse.json({ error: "El label es obligatorio" }, { status: 400 });
  }

  // Si es_default, primero quitar el flag de las otras variaciones
  if (is_default) {
    await supabase
      .from("product_variations")
      .update({ is_default: false })
      .eq("product_id", id);
  }

  const { data, error } = await supabase
    .from("product_variations")
    .insert({
      product_id: id,
      label: label.trim(),
      images: images ?? [],
      sort_order: sort_order ?? 0,
      is_default: is_default ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
