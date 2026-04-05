import Image from "next/image";

import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <article className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/30">
      <div className="flex gap-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[#FFF5F7]">
          {deal.imageUrl ? (
            <Image
              src={deal.imageUrl}
              alt={deal.productName}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8B6B7B]">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-[#4A2D3A]">{deal.productName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-[#FCE4EC] px-2 py-1 font-medium text-[#D4607A]">
              {deal.store}
            </span>
            {deal.validFrom || deal.validUntil ? (
              <span className="text-[#8B6B7B]">
                {deal.validFrom ? `from ${deal.validFrom}` : null}
                {deal.validFrom && deal.validUntil ? " · " : null}
                {deal.validUntil ? `until ${deal.validUntil}` : null}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-[#4A2D3A]">{formatCurrency(deal.price)}</p>
          {deal.oldPrice ? (
            <p className="text-xs text-[#8B6B7B] line-through">{formatCurrency(deal.oldPrice)}</p>
          ) : null}
        </div>
        {deal.discountPercent ? (
          <span className="rounded-lg bg-[#B8E6C8] px-2 py-1 text-xs font-semibold text-emerald-900">
            -{deal.discountPercent}%
          </span>
        ) : null}
      </div>
    </article>
  );
}
