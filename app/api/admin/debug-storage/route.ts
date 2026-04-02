import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get("bucket") || "images";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: files, error } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 50 });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mostrar estructura de los primeros 5 archivos
    return NextResponse.json({
      totalFiles: files?.length || 0,
      firstFiles: files?.slice(0, 5),
      sampleFile: files?.[0],
      sampleMetadata: files?.[0]?.metadata,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
