import { StoreCard } from "@/components/StoreCard";
import type { StoreInfo } from "@/lib/types";

interface StoreGuideProps {
  stores: StoreInfo[];
  loading?: boolean;
}

/**
 * Laden-Guide: Trier supermarkets with OSM hours + curated “known for” notes.
 */
export function StoreGuide({ stores, loading }: StoreGuideProps) {
  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Store Guide Trier</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Adressen + Offnungszeiten aus OpenStreetMap Overpass API, erganzt mit kurzen Tipps pro
          Kette.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Ladeninfos werden geladen...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {!loading && stores.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Keine Ladeninfos verfugbar. Overpass API war moglicherweise nicht erreichbar.
        </p>
      ) : null}
    </>
  );
}
