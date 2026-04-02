import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import * as fs from "fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ImageFile {
  name: string;
  size: number;
  created_at: string;
  updated_at: string;
  path: string;
}

async function analyzeStorage() {
  console.log("📊 Analizando imágenes en Storage...\n");

  // Listar todos los archivos
  const { data: files, error } = await supabase.storage
    .from("products")
    .list("", { limit: 10000 });

  if (error) {
    console.error("❌ Error al listar archivos:", error);
    process.exit(1);
  }

  if (!files || files.length === 0) {
    console.log("❌ No hay archivos en el bucket");
    process.exit(0);
  }

  console.log(`📁 Total de archivos encontrados: ${files.length}\n`);

  // Procesar archivos
  const imageFiles: ImageFile[] = files
    .filter((f) => !f.name.includes(".") === false) // Solo archivos, no carpetas
    .map((f) => ({
      name: f.name,
      size: f.metadata?.size || 0,
      created_at: f.created_at || "",
      updated_at: f.updated_at || "",
      path: f.name,
    }));

  // Estadísticas generales
  const totalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  const totalGB = (totalSize / (1024 * 1024 * 1024)).toFixed(3);

  console.log(`📊 Espacio total usado: ${totalMB} MB (${totalGB} GB)`);
  console.log(`📸 Cantidad de imágenes: ${imageFiles.length}\n`);

  // Detectar duplicadas por nombre similar
  console.log("🔍 POSIBLES DUPLICADAS (por nombre similar):\n");
  const nameMap = new Map<string, ImageFile[]>();
  imageFiles.forEach((file) => {
    const baseName = file.name.replace(/-\d+\.\w+$/, ""); // Quita números al final
    if (!nameMap.has(baseName)) nameMap.set(baseName, []);
    nameMap.get(baseName)!.push(file);
  });

  let duplicateCount = 0;
  nameMap.forEach((files, baseName) => {
    if (files.length > 1) {
      duplicateCount += files.length - 1;
      console.log(`  📄 ${baseName}`);
      files.forEach((f) => {
        const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
        const date = new Date(f.created_at).toLocaleDateString("es-AR");
        console.log(
          `     - ${f.name} (${sizeMB} MB, ${date})`
        );
      });
      console.log();
    }
  });

  if (duplicateCount === 0) {
    console.log("  ✅ No se encontraron duplicadas por nombre\n");
  } else {
    console.log(
      `  ⚠️  Posibles ${duplicateCount} archivos duplicados\n`
    );
  }

  // Archivos más antiguos
  console.log("📅 TOP 15 ARCHIVOS MÁS ANTIGUOS:\n");
  const sorted = [...imageFiles].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  sorted.slice(0, 15).forEach((f) => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    const date = new Date(f.created_at).toLocaleDateString("es-AR");
    const daysOld = Math.floor(
      (Date.now() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    console.log(
      `  ${f.name.padEnd(50)} | ${sizeMB} MB | ${date} (${daysOld} días)`
    );
  });

  // Archivos más grandes
  console.log("\n📦 TOP 15 ARCHIVOS MÁS GRANDES:\n");
  const sortedBySize = [...imageFiles].sort((a, b) => b.size - a.size);
  sortedBySize.slice(0, 15).forEach((f) => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(2);
    const date = new Date(f.created_at).toLocaleDateString("es-AR");
    console.log(
      `  ${f.name.padEnd(50)} | ${sizeMB} MB | ${date}`
    );
  });

  // Generar reporte en JSON
  const report = {
    summary: {
      totalFiles: imageFiles.length,
      totalSizeMB: parseFloat(totalMB),
      totalSizeGB: parseFloat(totalGB),
      possibleDuplicates: duplicateCount,
    },
    oldestFiles: sorted.slice(0, 20),
    largestFiles: sortedBySize.slice(0, 20),
    duplicateGroups: Array.from(nameMap.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([name, files]) => ({
        baseName: name,
        count: files.length,
        files: files.map((f) => ({
          name: f.name,
          sizeMB: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
          createdAt: f.created_at,
        })),
      })),
  };

  fs.writeFileSync(
    "./storage-analysis.json",
    JSON.stringify(report, null, 2)
  );
  console.log("\n✅ Análisis guardado en storage-analysis.json");
}

analyzeStorage().catch(console.error);
