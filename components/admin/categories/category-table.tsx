"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  product_count: number;
}

interface CategoryTableProps {
  categories: CategoryWithCount[];
  loading: boolean;
  onEdit: (category: CategoryWithCount) => void;
  onDelete: (category: CategoryWithCount) => void;
}

function RowActions({
  category,
  onEdit,
  onDelete,
}: {
  category: CategoryWithCount;
  onEdit: (c: CategoryWithCount) => void;
  onDelete: (c: CategoryWithCount) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(category)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

export function CategoryTable({
  categories,
  loading,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay categorías. Creá la primera.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="divide-y divide-gray-100 sm:hidden">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-gray-900 truncate">{category.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">{category.slug}</Badge>
                <Badge variant="outline" className="text-xs">
                  {category.product_count}{" "}
                  {category.product_count === 1 ? "producto" : "productos"}
                </Badge>
              </div>
            </div>
            <RowActions category={category} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{category.slug}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {category.product_count}{" "}
                    {category.product_count === 1 ? "producto" : "productos"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions category={category} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
