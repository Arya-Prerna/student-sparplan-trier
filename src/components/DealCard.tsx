import Image from "next/image";

import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.productName}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              Kein Bild
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-zinc-900">{deal.productName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-zinc-100 px-2 py-1 font-medium text-zinc-700">
              {deal.store}
            </span>
            {deal.validFrom || deal.validUntil ? (
              <span className="text-zinc-500">
                {deal.validFrom ? `ab ${deal.validFrom}` : null}
                {deal.validFrom && deal.validUntil ? " · " : null}
                {deal.validUntil ? `bis ${deal.validUntil}` : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-zinc-900">{formatCurrency(deal.price)}</p>
          {deal.oldPrice ? (
            <p className="text-xs text-zinc-500 line-through">{formatCurrency(deal.oldPrice)}</p>
          ) : null}
        </div>
        {deal.discountPercent ? (
          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
            -{deal.discountPercent}%
          </span>
        ) : null}
      </div>
    </article>
  );
}

