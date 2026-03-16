"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";
import type { Product } from "@/types";

export type SortField = "name" | "price" | "category" | "status";
export interface SortState { field: SortField | null; dir: "asc" | "desc" }

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  selectedIds: Set<string>;
  sort: SortState;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onSelectionChange: (ids: Set<string>) => void;
  onSortChange: (sort: SortState) => void;
}

function SortIcon({ field, sort }: { field: SortField; sort: SortState }) {
  if (sort.field !== field) return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
  return sort.dir === "asc"
    ? <ChevronUp className="h-3 w-3" />
    : <ChevronDown className="h-3 w-3" />;
}

function SortableHead({
  field, label, sort, onSortChange,
}: { field: SortField; label: string; sort: SortState; onSortChange: (s: SortState) => void }) {
  function handleClick() {
    if (sort.field === field) {
      onSortChange({ field, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      onSortChange({ field, dir: "asc" });
    }
  }
  return (
    <TableHead>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-1 font-medium hover:text-gray-900 transition-colors"
      >
        {label}
        <SortIcon field={field} sort={sort} />
      </button>
    </TableHead>
  );
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

export function ProductTable({
  products,
  loading,
  selectedIds,
  sort,
  onEdit,
  onDelete,
  onSelectionChange,
  onSortChange,
}: ProductTableProps) {
  function toggleAll() {
    if (selectedIds.size === products.length && products.length > 0) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(products.map((p) => p.id)));
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  const allSelected = products.length > 0 && selectedIds.size === products.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < products.length;

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
        No hay productos que coincidan con los filtros.
      </div>
    );
  }

  return (
    <>
      {/* Mobile: cards */}
      <ul className="divide-y divide-gray-100 sm:hidden">
        {products.map((product) => (
          <li key={product.id} className="flex items-center px-4 py-3 gap-3">
            <input
              type="checkbox"
              checked={selectedIds.has(product.id)}
              onChange={() => toggleOne(product.id)}
              className="h-4 w-4 rounded border-gray-300 text-gray-900 flex-shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
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
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900"
                />
              </TableHead>
              <SortableHead field="name" label="Nombre" sort={sort} onSortChange={onSortChange} />
              <SortableHead field="price" label="Precio" sort={sort} onSortChange={onSortChange} />
              <SortableHead field="category" label="Categoría" sort={sort} onSortChange={onSortChange} />
              <SortableHead field="status" label="Estado" sort={sort} onSortChange={onSortChange} />
              <TableHead className="w-24">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className={selectedIds.has(product.id) ? "bg-blue-50" : undefined}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(product.id)}
                    onChange={() => toggleOne(product.id)}
                    className="h-4 w-4 rounded border-gray-300 text-gray-900"
                  />
                </TableCell>
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
