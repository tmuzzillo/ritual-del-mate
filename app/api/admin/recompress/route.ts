import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  // Service role client — bypasses RLS
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const formData = await req.formData();
  const path = formData.get("path") as string;
  const file = formData.get("file") as File;

  if (!path || !file) {
    return NextResponse.json({ error: "path y file son requeridos" }, { status: 400 });
  }

  const { error } = await serviceClient.storage
    .from("images")
    .upload(path, file, { cacheControl: "3600", upsert: true, contentType: "image/jpeg" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
