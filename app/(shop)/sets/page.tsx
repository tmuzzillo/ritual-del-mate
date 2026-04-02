import { createClient } from "@/lib/supabase/server";
import { SetCard } from "@/components/shop/set-card";
import type { MateSet } from "@/types";

export default async function SetsPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("sets")
    .select("*, category:categories(id, name, slug), set_items(id, quantity, product:products(id, name, slug, price, images, is_active))")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const sets = (data ?? []) as MateSet[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-3xl font-extrabold text-brand-dark mb-8">Sets seleccionados</h1>

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
  );
}
