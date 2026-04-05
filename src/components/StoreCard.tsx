import type { StoreInfo } from "@/lib/types";

interface StoreCardProps {
  store: StoreInfo;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <article className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#4A2D3A]">{store.name}</h3>
          {store.address ? <p className="text-sm text-[#8B6B7B]">{store.address}</p> : null}
        </div>
        {store.openingHours ? (
          <span className="flex-shrink-0 rounded-lg bg-[#FCE4EC] px-2 py-1 text-xs font-medium text-[#D4607A]">
            {store.openingHours}
          </span>
        ) : (
          <span className="flex-shrink-0 rounded-lg bg-[#FFF5F7] px-2 py-1 text-xs text-[#8B6B7B]">
            Hours unavailable
          </span>
        )}
      </div>

      {store.notes ? <p className="mt-3 text-sm text-[#4A2D3A]">{store.notes}</p> : null}
    </article>
  );
}
