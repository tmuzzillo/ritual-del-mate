"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { MateSet } from "@/types";

interface SetTableProps {
  sets: MateSet[];
  loading: boolean;
  onEdit: (set: MateSet) => void;
  onDelete: (set: MateSet) => void;
}

function RowActions({ set, onEdit, onDelete }: {
  set: MateSet;
  onEdit: (s: MateSet) => void;
  onDelete: (s: MateSet) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(set)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(set)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export function SetTable({ sets, loading, onEdit, onDelete }: SetTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay sets. Creá el primero.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="divide-y divide-gray-100 sm:hidden">
        {sets.map((set) => (
          <li key={set.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-gray-900 truncate">{set.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">${set.price.toLocaleString("es-AR")}</span>
                {set.category && <Badge variant="secondary" className="text-xs">{set.category.name}</Badge>}
                <Badge variant="outline" className="text-xs">
                  {set.set_items?.length ?? 0} productos
                </Badge>
                <Badge variant={set.is_active ? "default" : "outline"} className="text-xs">
                  {set.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <RowActions set={set} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((set) => (
              <TableRow key={set.id}>
                <TableCell className="font-medium">{set.name}</TableCell>
                <TableCell>${set.price.toLocaleString("es-AR")}</TableCell>
                <TableCell>
                  {set.category
                    ? <Badge variant="secondary">{set.category.name}</Badge>
                    : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{set.set_items?.length ?? 0} productos</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={set.is_active ? "default" : "outline"}>
                    {set.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions set={set} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
