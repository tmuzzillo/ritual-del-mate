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

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  // Support lookup by slug or UUID
  const isUuid = /^[0-9a-f-]{36}$/.test(id);
  const field = isUuid ? "id" : "slug";

  const { data, error } = await supabase
    .from("collections")
    .select(SELECT_QUERY)
    .eq(field, id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });
  }

  const normalized = {
    ...data,
    products: (data.products as { product: unknown }[]).map((p) => p.product),
    sets: (data.sets as { set: unknown }[]).map((s) => s.set),
  };

  return NextResponse.json({ data: normalized });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { name, slug, description, images, is_active, productIds, setIds } =
    await req.json();

  if (!name || !slug) {
    return NextResponse.json({ error: "name y slug son requeridos" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("collections")
    .update({
      name,
      slug,
      description: description ?? null,
      images: images ?? [],
      is_active: is_active ?? false,
    })
    .eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "Ya existe una colección con ese slug" }, { status: 409 });
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Replace relations
  await supabase.from("collection_products").delete().eq("collection_id", id);
  await supabase.from("collection_sets").delete().eq("collection_id", id);

  if (productIds?.length) {
    const { error } = await supabase.from("collection_products").insert(
      productIds.map((pid: string) => ({ collection_id: id, product_id: pid }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (setIds?.length) {
    const { error } = await supabase.from("collection_sets").insert(
      setIds.map((sid: string) => ({ collection_id: id, set_id: sid }))
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("collections")
    .select(SELECT_QUERY)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const normalized = {
    ...data,
    products: (data.products as { product: unknown }[]).map((p) => p.product),
    sets: (data.sets as { set: unknown }[]).map((s) => s.set),
  };

  return NextResponse.json({ data: normalized });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
