import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET = "images";
const TEMP_DIR = "./temp-webp-conversion";
const FOLDERS = ["products", "variations", "collections"];

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

async function setupTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

async function downloadImage(
  bucket: string,
  path: string
): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

async function uploadImage(
  bucket: string,
  path: string,
  buffer: Buffer
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .update(path, buffer, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) throw error;
}

async function convertImageToWebp(
  imageBuffer: Buffer,
  originalName: string
): Promise<Buffer> {
  try {
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 85 })
      .toBuffer();
    return webpBuffer;
  } catch (error) {
    throw new Error(
      `Error converting ${originalName}: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function processFolder(
  folder: string
): Promise<ConversionResult[]> {
  console.log(`\n📁 Processing folder: ${folder}`);

  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 10000 });

  if (error) {
    console.error(`Error listing files in ${folder}:`, error);
    return [];
  }

  if (!files || files.length === 0) {
    console.log(`No files in ${folder}`);
    return [];
  }

  const results: ConversionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = `${folder}/${file.name}`;
    const progress = `[${i + 1}/${files.length}]`;

    try {
      const originalSize = file.metadata?.size || 0;

      if (originalSize === 0) {
        console.log(`${progress} ⏭️  ${file.name} (no size info)`);
        continue;
      }

      process.stdout.write(
        `${progress} 📥 Downloading ${file.name}...`
      );
      const originalBuffer = await downloadImage(BUCKET, filePath);

      process.stdout.write(" ⚙️  Converting...");
      const webpBuffer = await convertImageToWebp(
        originalBuffer,
        file.name
      );

      process.stdout.write(" 📤 Uploading...");
      await uploadImage(BUCKET, filePath, webpBuffer);

      const webpSize = webpBuffer.length;
      const saved = originalSize - webpSize;
      const savedPercent = Math.round((saved / originalSize) * 100);

      console.log(
        ` ✅ Done! ${originalSize} → ${webpSize} bytes (-${savedPercent}%)`
      );

      results.push({
        name: file.name,
        folder,
        originalSize,
        webpSize,
        saved,
        savedPercent,
        status: "success",
      });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`\n❌ Error processing ${file.name}: ${errorMsg}`);
      results.push({
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

  return results;
}

async function main() {
  console.log("🚀 Starting WebP conversion...\n");

  try {
    await setupTempDir();

    const allResults: ConversionResult[] = [];

    for (const folder of FOLDERS) {
      const results = await processFolder(folder);
      allResults.push(...results);
    }

    // Stats
    const successful = allResults.filter((r) => r.status === "success");
    const failed = allResults.filter((r) => r.status === "error");

    const totalOriginal = successful.reduce((sum, r) => sum + r.originalSize, 0);
    const totalWebp = successful.reduce((sum, r) => sum + r.webpSize, 0);
    const totalSaved = successful.reduce((sum, r) => sum + r.saved, 0);
    const avgPercent = Math.round(
      successful.reduce((sum, r) => sum + r.savedPercent, 0) / successful.length
    );

    console.log("\n" + "=".repeat(60));
    console.log("📊 CONVERSION SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`❌ Failed: ${failed.length}`);
    console.log(
      `\n📦 Original total: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`
    );
    console.log(`📦 WebP total: ${(totalWebp / (1024 * 1024)).toFixed(2)} MB`);
    console.log(
      `💾 Space saved: ${(totalSaved / (1024 * 1024)).toFixed(2)} MB (-${avgPercent}%)`
    );
    console.log("=".repeat(60));

    if (failed.length > 0) {
      console.log("\n⚠️  Failed files:");
      failed.forEach((r) => {
        console.log(`  - ${r.folder}/${r.name}: ${r.error}`);
      });
    }

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        successful: successful.length,
        failed: failed.length,
        totalOriginalMB: parseFloat((totalOriginal / (1024 * 1024)).toFixed(2)),
        totalWebpMB: parseFloat((totalWebp / (1024 * 1024)).toFixed(2)),
        spaceSavedMB: parseFloat((totalSaved / (1024 * 1024)).toFixed(2)),
        averagePercentSaved: avgPercent,
      },
      results: allResults,
    };

    fs.writeFileSync(
      "./webp-conversion-report.json",
      JSON.stringify(report, null, 2)
    );

    console.log("\n✅ Report saved to webp-conversion-report.json");

    // Cleanup
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true });
    }
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
