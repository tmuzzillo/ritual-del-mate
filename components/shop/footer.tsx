import Link from "next/link";
import { Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <span className="font-extrabold text-lg tracking-tight">Ritual del Mate</span>

        <nav className="flex items-center gap-8">
          <Link href="/catalogo" className="text-sm hover:text-brand-sand transition-colors">
            Catálogo
          </Link>
          <Link href="/sets" className="text-sm hover:text-brand-sand transition-colors">
            Sets
          </Link>
          <Link href="/colecciones" className="text-sm hover:text-brand-sand transition-colors">
            Colecciones
          </Link>
        </nav>

        <a
          href="https://www.instagram.com/ritualdelmate"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm hover:text-brand-sand transition-colors"
          aria-label="Instagram de Ritual del Mate"
        >
          <Instagram className="h-4 w-4" />
          <span>@ritualdelmate</span>
        </a>
      </div>

      <div className="border-t border-white/10 px-4 sm:px-6 py-4 flex items-center justify-center gap-4 text-xs text-brand-brown">
        <span>© {new Date().getFullYear()} Ritual del Mate. Todos los derechos reservados.</span>
        <Link href="/admin" className="hover:text-brand-sand transition-colors">
          Admin
        </Link>
      </div>
    </footer>
  );
}
