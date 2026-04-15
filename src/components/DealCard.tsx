import Image from "next/image";
import { CalendarDays, Store } from "lucide-react";

import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface DealCardProps {
  deal: Deal;
}

export function DealCard({ deal }: DealCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[#F9D5E5] bg-white shadow-[0_4px_20px_rgba(212,96,122,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(212,96,122,0.18)] cursor-pointer">
      {deal.discountPercent ? (
        <div className="absolute right-3 top-3 z-10">
          <span className="flex items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]">
            -{deal.discountPercent}%
          </span>
        </div>
      ) : null}

      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-[#FFF0F3] to-[#FCE4EC]">
        {deal.imageUrl ? (
          <Image
            src={deal.imageUrl}
            alt={deal.productName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Store className="h-10 w-10 text-[#F9D5E5]" aria-hidden />
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#4A2D3A]">
          {deal.productName}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FCE4EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#D4607A]">
            <Store className="h-3 w-3" aria-hidden />
            {deal.store}
          </span>
          {(deal.validFrom ?? deal.validUntil) ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF5F7] px-2 py-0.5 text-[10px] text-[#8B6B7B]">
              <CalendarDays className="h-3 w-3" aria-hidden />
              {deal.validFrom && deal.validUntil
                ? `until ${deal.validUntil}`
                : (deal.validFrom ?? deal.validUntil)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xl font-extrabold text-[#4A2D3A] tabular-nums">
              {formatCurrency(deal.price)}
            </p>
            {deal.oldPrice ? (
              <p className="text-xs text-[#8B6B7B] line-through tabular-nums">
                {formatCurrency(deal.oldPrice)}
              </p>
            ) : null}
          </div>
          {deal.discountPercent ? (
            <span className="rounded-xl bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Save {formatCurrency(deal.oldPrice! - deal.price)}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
