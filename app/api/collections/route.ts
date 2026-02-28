import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const SELECT_QUERY = `
  *,
  products:collection_products(
    product:products(id, name, slug, price, images, is_active)
  ),
  sets:collection_sets(
    set:sets(id, name, slug, price, images, is_active)
  )
`;

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";

  let query = supabase
    .from("collections")
    .select(SELECT_QUERY)
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = (data ?? []).map((col) => ({
    ...col,
    products: (col.products as { product: unknown }[]).map((p) => p.product),
    sets: (col.sets as { set: unknown }[]).map((s) => s.set),
  }));

  return NextResponse.json({ data: normalized });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, slug, description, images, is_active, productIds, setIds } =
    await req.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "name y slug son requeridos" }, { status: 400 });
  }

  const { data: collection, error: collectionError } = await supabase
    .from("collections")
    .insert({
      name,
      slug,
      description: description ?? null,
      images: images ?? [],
      is_active: is_active ?? false,
    })
    .select()
    .single();

  if (collectionError) {
    if (collectionError.code === "23505") {
      return NextResponse.json({ error: "Ya existe una colección con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: collectionError.message }, { status: 500 });
  }

  if (productIds?.length) {
    const { error } = await supabase.from("collection_products").insert(
      productIds.map((id: string) => ({ collection_id: collection.id, product_id: id }))
    );
    if (error) {
      await supabase.from("collections").delete().eq("id", collection.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (setIds?.length) {
    const { error } = await supabase.from("collection_sets").insert(
      setIds.map((id: string) => ({ collection_id: collection.id, set_id: id }))
    );
    if (error) {
      await supabase.from("collections").delete().eq("id", collection.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ data: collection }, { status: 201 });
}
