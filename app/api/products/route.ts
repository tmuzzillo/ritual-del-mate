import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";

  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
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

  const { name, slug, description, care_text, price, stock, images, category_id, is_active, featured } =
    await req.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "name y slug son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description: description ?? null,
      care_text: care_text ?? null,
      price: price ?? null,
      stock: stock ?? 0,
      images: images ?? [],
      category_id: category_id ?? null,
      is_active: is_active ?? false,
      featured: featured ?? false,
    })
    .select("*, category:categories(id, name, slug)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un producto con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
