import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos

interface ConversionResult {
  name: string;
  folder: string;
  originalSize: number;
  webpSize: number;
  saved: number;
  savedPercent: number;
  status: "success" | "error";
  error?: string;
}

const BUCKET = "images";
const FOLDERS = ["products", "variations", "collections"];

async function downloadImage(
  supabase: ReturnType<typeof createClient>,
  folder: string,
  name: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${folder}/${name}`);

  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

async function uploadImage(
  supabase: ReturnType<typeof createClient>,
  folder: string,
  name: string,
  buffer: Buffer
): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .update(`${folder}/${name}`, buffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (error) throw error;
}

async function convertImageToWebp(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer).webp({ quality: 85 }).toBuffer();
}

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const allResults: ConversionResult[] = [];
    let processedCount = 0;

    for (const folder of FOLDERS) {
      const { data: files } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 10000 });

      if (!files || files.length === 0) continue;

      for (const file of files) {
        try {
          const originalSize = file.metadata?.size || 0;

          if (originalSize === 0) continue;

          const originalBuffer = await downloadImage(
            supabase,
            folder,
            file.name
          );
          const webpBuffer = await convertImageToWebp(originalBuffer);

          await uploadImage(supabase, folder, file.name, webpBuffer);

          const webpSize = webpBuffer.length;
          const saved = originalSize - webpSize;
          const savedPercent = Math.round((saved / originalSize) * 100);

          allResults.push({
            name: file.name,
            folder,
            originalSize,
            webpSize,
            saved,
            savedPercent,
            status: "success",
          });

          processedCount++;

          // Log every 50 files
          if (processedCount % 50 === 0) {
            console.log(`✅ Procesadas ${processedCount} imágenes...`);
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          allResults.push({
            name: file.name,
            folder,
            originalSize: 0,
            webpSize: 0,
            saved: 0,
            savedPercent: 0,
            status: "error",
            error: errorMsg,
          });
        }
      }
    }

    const successful = allResults.filter((r) => r.status === "success");
    const failed = allResults.filter((r) => r.status === "error");

    const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
    const totalWebp = successful.reduce((sum, r) => sum + r.webpSize, 0);
    const totalSaved = successful.reduce((sum, r) => sum + r.saved, 0);
    const avgPercent =
      successful.length > 0
        ? Math.round(
            successful.reduce((sum, r) => sum + r.savedPercent, 0) /
              successful.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalFiles: successful.length + failed.length,
        successful: successful.length,
        failed: failed.length,
        totalOriginalGB: parseFloat((totalOriginal / (1024 * 1024 * 1024)).toFixed(3)),
        totalOriginalMB: parseFloat((totalOriginal / (1024 * 1024)).toFixed(2)),
        totalWebpGB: parseFloat((totalWebp / (1024 * 1024 * 1024)).toFixed(3)),
        totalWebpMB: parseFloat((totalWebp / (1024 * 1024)).toFixed(2)),
        spaceSavedGB: parseFloat((totalSaved / (1024 * 1024 * 1024)).toFixed(3)),
        spaceSavedMB: parseFloat((totalSaved / (1024 * 1024)).toFixed(2)),
        averagePercentSaved: avgPercent,
      },
      sampleResults: successful.slice(0, 10),
      failedFiles: failed.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
