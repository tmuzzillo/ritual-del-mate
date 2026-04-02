import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

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
const BATCH_SIZE = 30;

async function getAllFiles(supabase: ReturnType<typeof createClient>) {
  const allFiles: Array<{ folder: string; name: string; size: number }> = [];

  for (const folder of FOLDERS) {
    const { data: files } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: 10000 });

    if (files) {
      files.forEach((f) => {
        if (f.metadata?.size) {
          allFiles.push({
            folder,
            name: f.name,
            size: f.metadata.size,
          });
        }
      });
    }
  }

  return allFiles;
}

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchNumber = parseInt(searchParams.get("batch") || "0");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all files list
    const allFiles = await getAllFiles(supabase);
    const totalFiles = allFiles.length;

    // Get batch
    const startIdx = batchNumber * BATCH_SIZE;
    const endIdx = startIdx + BATCH_SIZE;
    const batchFiles = allFiles.slice(startIdx, endIdx);
    const isLastBatch = endIdx >= totalFiles;

    const results: ConversionResult[] = [];
    let processedCount = 0;

    for (const file of batchFiles) {
      try {
        const originalBuffer = await downloadImage(
          supabase,
          file.folder,
          file.name
        );
        const webpBuffer = await convertImageToWebp(originalBuffer);
        await uploadImage(supabase, file.folder, file.name, webpBuffer);

        const saved = file.size - webpBuffer.length;
        const savedPercent = Math.round((saved / file.size) * 100);

        results.push({
          name: file.name,
          folder: file.folder,
          originalSize: file.size,
          webpSize: webpBuffer.length,
          saved,
          savedPercent,
          status: "success",
        });

        processedCount++;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        results.push({
          name: file.name,
          folder: file.folder,
          originalSize: file.size,
          webpSize: 0,
          saved: 0,
          savedPercent: 0,
          status: "error",
          error: errorMsg,
        });
      }
    }

    const successful = results.filter((r) => r.status === "success");
    const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
    const totalWebp = successful.reduce((sum, r) => sum + r.webpSize, 0);
    const totalSaved = successful.reduce((sum, r) => sum + r.saved, 0);

    return NextResponse.json({
      success: true,
      progress: {
        currentBatch: batchNumber,
        totalBatches: Math.ceil(totalFiles / BATCH_SIZE),
        processedFiles: Math.min(endIdx, totalFiles),
        totalFiles,
        isLastBatch,
      },
      batch: {
        successful: successful.length,
        failed: results.filter((r) => r.status === "error").length,
        totalOriginalMB: parseFloat((totalOriginal / (1024 * 1024)).toFixed(2)),
        totalWebpMB: parseFloat((totalWebp / (1024 * 1024)).toFixed(2)),
        spaceSavedMB: parseFloat((totalSaved / (1024 * 1024)).toFixed(2)),
        averagePercentSaved:
          successful.length > 0
            ? Math.round(
                successful.reduce((sum, r) => sum + r.savedPercent, 0) /
                  successful.length
              )
            : 0,
      },
      results: results.slice(0, 5), // Return first 5 for preview
      nextBatch: isLastBatch ? null : batchNumber + 1,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
