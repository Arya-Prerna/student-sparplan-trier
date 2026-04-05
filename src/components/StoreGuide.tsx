import { StoreCard } from "@/components/StoreCard";
import type { StoreInfo } from "@/lib/types";

interface StoreGuideProps {
  stores: StoreInfo[];
  loading?: boolean;
  zipCode?: string;
}

export function StoreGuide({ stores, loading, zipCode }: StoreGuideProps) {
  return (
    <>
      <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/40">
        <h2 className="text-lg font-semibold text-[#4A2D3A]">Store guide</h2>
        <p className="mt-1 text-sm text-[#8B6B7B]">
          Addresses and opening hours from OpenStreetMap (Overpass). Tips are curated notes per chain.
          {zipCode ? (
            <>
              {" "}
              Showing locations matching postal code <strong>{zipCode}</strong> where available; otherwise
              all Trier-area listings.
            </>
          ) : null}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[#8B6B7B]">Loading store info…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {!loading && stores.length === 0 ? (
        <p className="text-sm text-[#8B6B7B]">
          No store data available. The Overpass API may be unreachable.
        </p>
      ) : null}
    </>
  );
}
