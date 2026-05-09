import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";

  let query = supabase
    .from("sets")
    .select(`
      *,
      category:categories(id, name, slug),
      set_items(id, product_id, quantity, variation_id, is_gift, product:products(id, name, slug, price, images, is_active, stock), variation:product_variations(id, label, images, stock))
    `)
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, slug, description, price, images, category_id, is_active, featured, items } =
    await req.json();

  if (!name || !slug || price == null) {
    return NextResponse.json({ error: "name, slug y price son requeridos" }, { status: 400 });
  }

  const { data: set, error: setError } = await supabase
    .from("sets")
    .insert({
      name,
      slug,
      description: description ?? null,
      price,
      images: images ?? [],
      category_id: category_id ?? null,
      is_active: is_active ?? false,
      featured: featured ?? false,
    })
    .select()
    .single();

  if (setError) {
    if (setError.code === "23505") {
      return NextResponse.json({ error: "Ya existe un set con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: setError.message }, { status: 500 });
  }

  if (items && items.length > 0) {
    const setItems = items.map((item: { product_id: string; quantity: number; variation_id?: string | null; is_gift?: boolean }) => ({
      set_id: set.id,
      product_id: item.product_id,
      quantity: item.quantity,
      variation_id: item.variation_id ?? null,
      is_gift: item.is_gift ?? false,
    }));

    const { error: itemsError } = await supabase.from("set_items").insert(setItems);
    if (itemsError) {
      await supabase.from("sets").delete().eq("id", set.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("sets")
    .select(`
      *,
      category:categories(id, name, slug),
      set_items(id, product_id, quantity, variation_id, is_gift, product:products(id, name, slug, price, images, is_active, stock), variation:product_variations(id, label, images, stock))
    `)
    .eq("id", set.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
