"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/sets", label: "Sets" },
  { href: "/admin/colecciones", label: "Colecciones" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 overflow-x-auto">
      <ul className="flex gap-1 min-w-max">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "inline-block px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
