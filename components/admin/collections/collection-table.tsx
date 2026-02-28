"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Collection } from "@/types";

interface CollectionTableProps {
  collections: Collection[];
  loading: boolean;
  onEdit: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
}

function RowActions({ collection, onEdit, onDelete }: {
  collection: Collection;
  onEdit: (c: Collection) => void;
  onDelete: (c: Collection) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(collection)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(collection)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export function CollectionTable({
  collections, loading, onEdit, onDelete,
}: CollectionTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay colecciones. Creá la primera.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="divide-y divide-gray-100 sm:hidden">
        {collections.map((col) => (
          <li key={col.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-gray-900 truncate">{col.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {col.products?.length ?? 0} productos
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {col.sets?.length ?? 0} sets
                </Badge>
                <Badge variant={col.is_active ? "default" : "outline"} className="text-xs">
                  {col.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>
            <RowActions collection={col} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((col) => (
              <TableRow key={col.id}>
                <TableCell className="font-medium">{col.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{col.products?.length ?? 0} productos</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{col.sets?.length ?? 0} sets</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={col.is_active ? "default" : "outline"}>
                    {col.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions collection={col} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
