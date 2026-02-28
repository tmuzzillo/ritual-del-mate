"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface SelectableItem {
  id: string;
  name: string;
  slug: string;
  price?: number | null;
  is_active: boolean;
}

interface MultiSelectorProps {
  items: SelectableItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function MultiSelector({
  items,
  selectedIds,
  onChange,
  placeholder = "Buscar...",
}: MultiSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const selectedSet = new Set(selectedIds);

  function toggle(id: string) {
    if (selectedSet.has(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function removeSelected(id: string) {
    onChange(selectedIds.filter((sid) => sid !== id));
  }

  const selectedItems = items.filter((item) => selectedSet.has(item.id));

  return (
    <div className="space-y-2">
      {/* Selected chips */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full"
            >
              {item.name}
              <button
                type="button"
                onClick={() => removeSelected(item.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          className="pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="px-3 py-3 text-sm text-gray-500">Sin resultados.</p>
        )}
        {filtered.map((item) => {
          const isSelected = selectedSet.has(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm",
                isSelected && "bg-gray-50"
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggle(item.id)}
                className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className="flex-1 truncate">{item.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                {item.price != null && (
                  <span className="text-gray-500">${item.price.toLocaleString("es-AR")}</span>
                )}
                {!item.is_active && (
                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-300">
                    Inactivo
                  </Badge>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
