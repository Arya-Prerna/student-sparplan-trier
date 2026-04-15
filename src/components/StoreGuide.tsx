import { MapPin } from "lucide-react";

import { StoreCard } from "@/components/StoreCard";
import type { StoreInfo } from "@/lib/types";

interface StoreGuideProps {
  stores: StoreInfo[];
  loading?: boolean;
  zipCode?: string;
  relaxedPlzFilter?: boolean;
}

export function StoreGuide({ stores, loading, zipCode, relaxedPlzFilter }: StoreGuideProps) {
  return (
    <>
      <div className="rounded-3xl border border-[#F9D5E5] bg-white p-5 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCE4EC]">
            <MapPin className="h-5 w-5 text-[#D4607A]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#4A2D3A]">Store guide</h2>
            <p className="text-sm text-[#8B6B7B]">
              {zipCode ? (
                <>
                  Stores near <strong className="text-[#D4607A]">{zipCode}</strong>
                  {relaxedPlzFilter ? " · showing nearby area" : ""}
                </>
              ) : (
                "Addresses and opening hours from OpenStreetMap"
              )}
            </p>
          </div>
          {stores.length > 0 ? (
            <span className="ml-auto rounded-full bg-[#FCE4EC] px-3 py-1 text-xs font-bold text-[#D4607A]">
              {stores.length} stores
            </span>
          ) : null}
        </div>
        {relaxedPlzFilter ? (
          <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            OSM has limited postcode data for this area — showing stores by address match or all Trier supermarkets.
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-[#FCE4EC]/50" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {!loading && stores.length === 0 ? (
        <div className="rounded-3xl border border-[#F9D5E5] bg-white p-8 text-center shadow-sm">
          <MapPin className="mx-auto mb-3 h-10 w-10 text-[#F9D5E5]" aria-hidden />
          <p className="text-sm text-[#8B6B7B]">No store data available. The Overpass API may be unreachable.</p>
        </div>
      ) : null}
    </>
  );
}
