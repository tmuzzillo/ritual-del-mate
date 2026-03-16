"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types";

export interface FilterState {
  search: string;
  categoryId: string | null;
  status: "all" | "active" | "inactive";
}

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function ProductFilters({
  categories,
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: ProductFiltersProps) {
  function set(partial: Partial<FilterState>) {
    onFiltersChange({ ...filters, ...partial });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-200">
      <Input
        placeholder="Buscar por nombre..."
        value={filters.search}
        onChange={(e) => set({ search: e.target.value })}
        className="sm:max-w-xs"
      />
      <Select
        value={filters.categoryId ?? "all"}
        onValueChange={(v) => set({ categoryId: v === "all" ? null : v })}
      >
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.status}
        onValueChange={(v) => set({ status: v as FilterState["status"] })}
      >
        <SelectTrigger className="sm:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-sm text-gray-500 self-center sm:ml-auto whitespace-nowrap">
        {filteredCount === totalCount
          ? `${totalCount} producto${totalCount !== 1 ? "s" : ""}`
          : `${filteredCount} de ${totalCount}`}
      </span>
    </div>
  );
}
