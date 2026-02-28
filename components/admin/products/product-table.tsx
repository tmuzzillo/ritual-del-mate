"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function RowActions({ product, onEdit, onDelete }: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
}) {
  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onDelete(product)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

function formatPrice(price: number | null) {
  if (price == null) return <span className="text-gray-400">Sin precio</span>;
  return `$${price.toLocaleString("es-AR")}`;
}

export function ProductTable({ products, loading, onEdit, onDelete }: ProductTableProps) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay productos. Creá el primero.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="divide-y divide-gray-100 sm:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0 space-y-1">
              <p className="font-medium text-gray-900 truncate">{product.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">{formatPrice(product.price)}</span>
                {product.category && (
                  <Badge variant="secondary" className="text-xs">{product.category.name}</Badge>
                )}
                <Badge variant={product.is_active ? "default" : "outline"} className="text-xs">
                  {product.is_active ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
            <RowActions product={product} onEdit={onEdit} onDelete={onDelete} />
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
              <TableHead>Estado</TableHead>
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{formatPrice(product.price)}</TableCell>
                <TableCell>
                  {product.category
                    ? <Badge variant="secondary">{product.category.name}</Badge>
                    : <span className="text-gray-400">—</span>}
                </TableCell>
                <TableCell>
                  <Badge variant={product.is_active ? "default" : "outline"}>
                    {product.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RowActions product={product} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
