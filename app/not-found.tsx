import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col items-center justify-center px-4 text-center gap-6">
      <h1 className="text-6xl font-extrabold text-brand-dark">404</h1>
      <p className="text-brand-brown text-lg max-w-sm">
        Esta página no existe o ya no está disponible.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-full bg-brand-orange text-white font-semibold px-8 py-3 text-sm hover:bg-brand-orange-hover transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
