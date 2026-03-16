import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH: apply same changes to all ids, OR per-product updates for percentage price
// Body option A: { ids: string[], changes: { price?, is_active?, featured?, category_id? } }
// Body option B: { updates: Array<{ id: string, changes: { price: number } }> }
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.updates) {
    // Per-product updates (used for percentage price adjustment)
    const updates: Array<{ id: string; changes: Record<string, unknown> }> = body.updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: "updates requeridos" }, { status: 400 });
    }
    const results = await Promise.all(
      updates.map(({ id, changes }) =>
        supabase.from("products").update(changes).eq("id", id)
      )
    );
    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
      return NextResponse.json({ error: failed[0].error!.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Same changes for all ids
  const { ids, changes } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requeridos" }, { status: 400 });
  }
  if (!changes || typeof changes !== "object") {
    return NextResponse.json({ error: "changes requerido" }, { status: 400 });
  }

  const { error } = await supabase.from("products").update(changes).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids requeridos" }, { status: 400 });
  }

  const { error } = await supabase.from("products").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
