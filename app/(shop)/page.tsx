import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/shop/product-card";
import { AnimatedSection } from "@/components/shop/animated-section";
import { CollectionCardHome } from "@/components/shop/collection-card-home";
import { SetsCarousel } from "@/components/shop/sets-carousel";
import { HeroAnimations } from "@/components/shop/hero-animations";

export default async function HomePage() {
  const supabase = await createClient();

  const [collectionsRes, setsRes, productsRes] = await Promise.all([
    supabase
      .from("collections")
      .select("id, name, slug, description, tagline, images, is_active, created_at")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("sets")
      .select("id, name, slug, price, images, description, category_id, is_active, featured, created_at")
      .eq("is_active", true)
      .eq("featured", true)
      .limit(6),
    supabase
      .from("products")
      .select("id, name, slug, price, description, images, is_active, featured, created_at, stock, category_id, variations:product_variations(id, product_id, label, images, is_default, is_active, sort_order, created_at)")
      .eq("is_active", true)
      .eq("featured", true)
      .limit(4),
  ]);

  const collections = collectionsRes.data ?? [];
  const sets = setsRes.data ?? [];
  const products = productsRes.data ?? [];

  return (
    <div className="bg-brand-cream min-h-screen">

      {/* ── 1. HERO ─────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        <HeroAnimations>
          <Image
            src="/logo-blob.jpg"
            alt="Ritual del Mate"
            width={200}
            height={200}
            className="mx-auto object-contain mb-8 mix-blend-multiply"
            priority
          />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark leading-tight tracking-tight max-w-2xl">
            Rituales que hablan de vos
          </h1>
          <p className="mt-4 text-base sm:text-lg text-brand-brown max-w-md mx-auto leading-relaxed">
            Tu momento matero de cada día merece ser elegido con intención.
          </p>
          <a
            href="#colecciones"
            className="mt-10 inline-flex items-center gap-2 bg-brand-orange text-white font-semibold px-8 py-3 rounded-full hover:bg-brand-orange-hover transition-colors text-sm"
          >
            Explorar
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </HeroAnimations>
      </section>

      {/* ── 2. COLECCIONES ──────────────────────────────────── */}
      {collections.length > 0 && (
        <section id="colecciones" className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <AnimatedSection>
            <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-2">
              Tu ritual, tu identidad
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-12">
              Colecciones
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {collections.map((collection, i) => (
              <AnimatedSection key={collection.id} delay={i * 0.12} direction="up">
                <CollectionCardHome collection={collection} />
              </AnimatedSection>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. SETS ─────────────────────────────────────────── */}
      {sets.length > 0 && (
        <section className="py-20 bg-brand-golden/20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
            <AnimatedSection>
              <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-2">
                Armados con intención
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                Los más elegidos
              </h2>
            </AnimatedSection>
          </div>

          <AnimatedSection delay={0.1}>
            <SetsCarousel sets={sets} />
          </AnimatedSection>
        </section>
      )}

      {/* ── 4. PRODUCTOS ────────────────────────────────────── */}
      {products.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <AnimatedSection className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-2">
                Piezas seleccionadas
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-dark">
                También podés armar tu propio ritual
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors shrink-0 ml-8"
            >
              Ver catálogo completo
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {products.map((product, i) => (
              <AnimatedSection key={product.id} delay={i * 0.08}>
                <ProductCard product={product} />
              </AnimatedSection>
            ))}
          </div>

          <AnimatedSection className="mt-8 sm:hidden text-center">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-orange hover:text-brand-orange-hover transition-colors"
            >
              Ver catálogo completo
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </AnimatedSection>
        </section>
      )}

      {/* ── 5. MARCA ────────────────────────────────────────── */}
      <section className="bg-brand-dark text-brand-cream">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <AnimatedSection>
<h2 className="text-2xl sm:text-3xl font-bold mb-6 leading-snug">
              Sobre Ritual del Mate
            </h2>
            <blockquote className="border-l-2 border-brand-orange pl-6 text-left max-w-xl mx-auto">
              <p className="text-brand-cream/90 italic text-base sm:text-lg leading-relaxed">
                "Gracias por elegir Ritual del Mate. Cada pieza fue elegida con intención para quienes valoran la belleza en los detalles y transforman lo cotidiano en ritual. Que esto que hoy llega a tus manos sea tu pausa, tu calma y ese momento que volvés a vos."
              </p>
            </blockquote>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
