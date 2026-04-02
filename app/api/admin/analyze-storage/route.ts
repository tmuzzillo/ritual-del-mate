import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bucketName = searchParams.get("bucket") || "products";

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Listar folders y archivos
    const { data: rootItems, error } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 10000 });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: `¿El bucket "${bucketName}" existe? Prueba con ?bucket=nombre-del-bucket`
        },
        { status: 500 }
      );
    }

    if (!rootItems || rootItems.length === 0) {
      return NextResponse.json({
        message: `No hay archivos en el bucket "${bucketName}"`,
        files: [],
        hint: "¿Es este el nombre correcto del bucket?",
      });
    }

    // Recopilar todos los archivos de todas las carpetas
    let allFiles: Array<{
      name: string;
      size: number;
      created_at: string;
      updated_at: string;
      folder: string;
    }> = [];

    for (const item of rootItems) {
      if (!item.name) continue;

      // Si es una carpeta (no tiene metadata.size)
      if (item.metadata === null) {
        const { data: folderFiles } = await supabase.storage
          .from(bucketName)
          .list(item.name, { limit: 10000 });

        if (folderFiles) {
          folderFiles.forEach((f) => {
            if (f.name && f.metadata?.size) {
              allFiles.push({
                name: f.name,
                size: f.metadata.size,
                created_at: f.created_at || "",
                updated_at: f.updated_at || "",
                folder: item.name,
              });
            }
          });
        }
      }
    }

    if (allFiles.length === 0) {
      return NextResponse.json({
        message: `No hay imágenes en las carpetas de "${bucketName}"`,
        folders: rootItems.map((i) => i.name),
      });
    }

    const files = allFiles;

    // Procesar archivos
    const imageFiles = files
      .filter((f) => f.name && f.size > 0)
      .map((f) => ({
        name: f.name,
        size: f.size,
        created_at: f.created_at || new Date().toISOString(),
        updated_at: f.updated_at || new Date().toISOString(),
        folder: f.folder,
      }));

    if (imageFiles.length === 0) {
      return NextResponse.json({
        message: `No hay archivos con información de tamaño en "${bucketName}"`,
        files: [],
      });
    }

    const totalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
    const totalMB = totalSize / (1024 * 1024);
    const totalGB = totalSize / (1024 * 1024 * 1024);

    // Detectar duplicadas por nombre similar
    const nameMap = new Map<string, typeof imageFiles>();
    imageFiles.forEach((file) => {
      const baseName = file.name.replace(/-\d+\.\w+$/, "");
      if (!nameMap.has(baseName)) nameMap.set(baseName, []);
      nameMap.get(baseName)!.push(file);
    });

    const duplicateGroups = Array.from(nameMap.entries())
      .filter(([_, files]) => files.length > 1)
      .map(([name, files]) => ({
        baseName: name,
        count: files.length,
        totalSizeMB: parseFloat(
          ((files.reduce((sum, f) => sum + f.size, 0)) / (1024 * 1024)).toFixed(2)
        ),
        files: files.map((f) => ({
          name: f.name,
          sizeMB: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
          createdAt: f.created_at,
        })),
      }));

    // Archivos más antiguos
    const sortedByAge = [...imageFiles].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Archivos más grandes
    const sortedBySize = [...imageFiles].sort((a, b) => b.size - a.size);

    return NextResponse.json({
      summary: {
        totalFiles: imageFiles.length,
        totalSizeMB: parseFloat(totalMB.toFixed(2)),
        totalSizeGB: parseFloat(totalGB.toFixed(3)),
        possibleDuplicates: duplicateGroups.reduce(
          (sum, g) => sum + (g.count - 1),
          0
        ),
      },
      oldestFiles: sortedByAge.slice(0, 20).map((f) => ({
        ...f,
        sizeMB: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
        daysOld: Math.floor(
          (Date.now() - new Date(f.created_at).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
      largestFiles: sortedBySize.slice(0, 20).map((f) => ({
        ...f,
        sizeMB: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
      })),
      duplicateGroups,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
