"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";

import { formatCurrency } from "@/lib/normalize";
import type { StudentPick } from "@/lib/types";

interface StudentPicksProps {
  picks: StudentPick[];
  loading: boolean;
}

function SkeletonCard() {
  return (
    <div className="min-w-[220px] max-w-[260px] flex-shrink-0 animate-pulse rounded-2xl border border-[#F9D5E5] bg-white p-3">
      <div className="h-24 rounded-xl bg-[#FCE4EC]" />
      <div className="mt-3 h-4 w-3/4 rounded bg-[#FCE4EC]" />
      <div className="mt-2 h-3 w-1/2 rounded bg-[#FFF5F7]" />
    </div>
  );
}

export function StudentPicks({ picks, loading }: StudentPicksProps) {
  return (
    <section className="rounded-2xl border border-[#F9D5E5] bg-gradient-to-br from-white to-[#FFF5F7] p-4 shadow-md shadow-rose-100/40">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FCE4EC] text-[#D4607A]">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-[#4A2D3A]">Top picks for students this week</h2>
          <p className="text-xs text-[#8B6B7B]">
            Curated from current discounts — staples and best value for your basket.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : picks.length === 0 ? (
        <p className="text-sm text-[#8B6B7B]">No picks available yet — try again in a moment.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
          {picks.map((pick, i) => (
            <article
              key={`${pick.productName}-${pick.store}-${i}`}
              className="min-w-[220px] max-w-none flex-shrink-0 rounded-2xl border border-[#F9D5E5] bg-white p-3 shadow-sm sm:min-w-0"
            >
              <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[#FFF5F7]">
                {pick.imageUrl ? (
                  <Image
                    src={pick.imageUrl}
                    alt={pick.productName}
                    fill
                    sizes="(max-width:640px) 220px, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-[#8B6B7B]">
                    No image
                  </div>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#4A2D3A]">
                {pick.productName}
              </p>
              <span className="mt-1 inline-block rounded-full bg-[#FCE4EC] px-2 py-0.5 text-[11px] font-medium text-[#D4607A]">
                {pick.store}
              </span>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-base font-bold text-[#4A2D3A]">
                  {pick.price > 0 ? formatCurrency(pick.price) : "—"}
                </p>
                {pick.discountPercent ? (
                  <span className="rounded-lg bg-[#B8E6C8] px-2 py-0.5 text-[11px] font-semibold text-emerald-900">
                    -{pick.discountPercent}%
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-snug text-[#8B6B7B]">{pick.reason}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
