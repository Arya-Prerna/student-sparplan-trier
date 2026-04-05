import type { StoreInfo } from "@/lib/types";

interface StoreCardProps {
  store: StoreInfo;
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{store.name}</h3>
          {store.address ? <p className="text-sm text-zinc-600">{store.address}</p> : null}
        </div>
        {store.openingHours ? (
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
            {store.openingHours}
          </span>
        ) : (
          <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-500">
            Offnungszeiten nicht verfugbar
          </span>
        )}
      </div>

      {store.notes ? <p className="mt-3 text-sm text-zinc-700">{store.notes}</p> : null}
    </article>
  );
}

