"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2 } from "lucide-react";

interface StorageAnalysis {
  summary: {
    totalFiles: number;
    totalSizeMB: number;
    totalSizeGB: number;
    possibleDuplicates: number;
  };
  oldestFiles: Array<{
    name: string;
    sizeMB: number;
    createdAt: string;
    daysOld: number;
  }>;
  largestFiles: Array<{
    name: string;
    sizeMB: number;
    createdAt: string;
  }>;
  duplicateGroups: Array<{
    baseName: string;
    count: number;
    totalSizeMB: number;
    files: Array<{
      name: string;
      sizeMB: number;
      createdAt: string;
    }>;
  }>;
}

export default function StorageAnalysisPage() {
  const [analysis, setAnalysis] = useState<StorageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeStorage = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/analyze-storage");
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Error al analizar storage");
      }

      if (!data.summary) {
        throw new Error("Respuesta inválida del servidor");
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeStorage();
  }, []);

  const downloadReport = () => {
    if (!analysis) return;
    const json = JSON.stringify(analysis, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `storage-analysis-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Análisis de Storage</h1>
        <p className="text-sm text-gray-600 mt-2">
          Detecta imágenes duplicadas y viejas para liberar espacio
        </p>
      </div>

      <Button
        onClick={analyzeStorage}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analizando...
          </>
        ) : (
          "Actualizar análisis"
        )}
      </Button>

      {loading && (
        <Card>
          <CardContent className="pt-6 flex gap-3 items-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            <div className="text-gray-700">Analizando imágenes...</div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de imágenes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {analysis.summary.totalFiles}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Espacio usado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {analysis.summary.totalSizeGB.toFixed(2)} GB
                </p>
                <p className="text-xs text-gray-500">
                  ({analysis.summary.totalSizeMB.toFixed(0)} MB)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Posibles duplicadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-600">
                  {analysis.summary.possibleDuplicates}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Grupos encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {analysis.duplicateGroups.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Duplicados */}
          {analysis.duplicateGroups.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg">
                  🔍 Posibles Duplicadas ({analysis.duplicateGroups.length}{" "}
                  grupos)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.duplicateGroups.map((group) => (
                  <div key={group.baseName} className="border rounded-lg p-4">
                    <p className="font-semibold text-sm mb-2">
                      {group.baseName}
                      <span className="text-amber-600 ml-2">
                        ({group.count} archivos, {group.totalSizeMB.toFixed(2)}{" "}
                        MB total)
                      </span>
                    </p>
                    <ul className="space-y-1 text-sm">
                      {group.files.map((f) => (
                        <li
                          key={f.name}
                          className="text-gray-700 flex justify-between"
                        >
                          <span className="font-mono text-xs break-all">
                            {f.name}
                          </span>
                          <span className="text-gray-500 text-xs whitespace-nowrap ml-2">
                            {f.sizeMB.toFixed(2)} MB (
                            {new Date(f.createdAt).toLocaleDateString("es-AR")}
                            )
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Top 20 más antiguos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                📅 Top 20 Archivos más antiguos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-gray-600 text-xs font-semibold">
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2 text-right">Tamaño</th>
                      <th className="pb-2 text-right">Fecha</th>
                      <th className="pb-2 text-right">Antigüedad</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.oldestFiles.map((f) => (
                      <tr key={f.name} className="hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs truncate">
                          {f.name}
                        </td>
                        <td className="py-2 text-right text-xs">
                          {f.sizeMB.toFixed(2)} MB
                        </td>
                        <td className="py-2 text-right text-xs">
                          {new Date(f.createdAt).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-2 text-right text-xs text-gray-500">
                          {f.daysOld} días
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top 20 más grandes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                📦 Top 20 Archivos más grandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr className="text-left text-gray-600 text-xs font-semibold">
                      <th className="pb-2">Nombre</th>
                      <th className="pb-2 text-right">Tamaño</th>
                      <th className="pb-2 text-right">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {analysis.largestFiles.map((f) => (
                      <tr key={f.name} className="hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs truncate">
                          {f.name}
                        </td>
                        <td className="py-2 text-right text-xs font-semibold">
                          {f.sizeMB.toFixed(2)} MB
                        </td>
                        <td className="py-2 text-right text-xs">
                          {new Date(f.createdAt).toLocaleDateString("es-AR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Download button */}
          <Button
            onClick={downloadReport}
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar reporte JSON
          </Button>
        </>
      )}
    </div>
  );
}
