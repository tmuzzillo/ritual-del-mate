import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetCard } from "@/components/shop/set-card";
import type { MateSet } from "@/types";

export default async function SetsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sets")
    .select("*, category:categories(id, name, slug), set_items(id, quantity, product:products(id, name, slug, price, images, is_active))")
    .eq("is_active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  const sets = (data ?? []) as MateSet[];

  return (
    <div>
      {/* Header branded */}
      <div className="bg-brand-golden/20 border-b border-brand-sand">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <Link
            href="/"
            className="text-sm text-brand-brown hover:text-brand-dark transition-colors mb-6 inline-block"
          >
            ← Inicio
          </Link>
          <p className="text-brand-orange text-xs font-semibold uppercase tracking-widest mb-2">
            Armados con intención
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-brand-dark leading-tight">
            Sets seleccionados
          </h1>
          <p className="text-brand-brown mt-2 text-base">
            Para simplificar tu elección y que cada mate tenga todo lo que necesita.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {sets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sets.map((set) => (
              <SetCard key={set.id} set={set} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <p className="text-brand-brown text-lg">No hay sets disponibles por el momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
