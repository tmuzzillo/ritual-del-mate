import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { label, images, is_active, sort_order } = await req.json();

  if (label !== undefined && !label?.trim()) {
    return NextResponse.json({ error: "El label no puede estar vacío" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (label !== undefined) updates.label = label.trim();
  if (images !== undefined) updates.images = images;
  if (is_active !== undefined) updates.is_active = is_active;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from("product_variations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Variación no encontrada" }, { status: error ? 500 : 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Verificar que la variación no esté en ningún set_item
  const { count } = await supabase
    .from("set_items")
    .select("*", { count: "exact", head: true })
    .eq("variation_id", id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Esta variación está incluida en ${count} set${count > 1 ? "s" : ""}. Editá el set primero.` },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("product_variations").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
