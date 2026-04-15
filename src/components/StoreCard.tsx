import { Clock, MapPin } from "lucide-react";

import type { StoreInfo } from "@/lib/types";

interface StoreCardProps {
  store: StoreInfo;
}

function getStoreInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getStoreColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("aldi")) return "bg-[#0050AA] text-white";
  if (n.includes("lidl")) return "bg-[#0050AA] text-yellow-300";
  if (n.includes("rewe")) return "bg-red-600 text-white";
  if (n.includes("edeka")) return "bg-yellow-400 text-[#4A2D3A]";
  if (n.includes("kaufland")) return "bg-red-700 text-white";
  if (n.includes("netto")) return "bg-yellow-400 text-[#4A2D3A]";
  if (n.includes("penny")) return "bg-red-500 text-white";
  if (n.includes("rossmann")) return "bg-red-600 text-white";
  if (n.includes("dm")) return "bg-orange-500 text-white";
  return "bg-[#FCE4EC] text-[#D4607A]";
}

export function StoreCard({ store }: StoreCardProps) {
  const initials = getStoreInitials(store.name);
  const colorClass = getStoreColor(store.name);

  return (
    <article className="group rounded-3xl border border-[#F9D5E5] bg-white p-5 shadow-[0_4px_20px_rgba(212,96,122,0.07)] transition-all duration-200 hover:shadow-[0_8px_24px_rgba(212,96,122,0.14)] hover:-translate-y-0.5">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${colorClass}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#4A2D3A]">{store.name}</h3>
          {store.address ? (
            <p className="mt-0.5 flex items-start gap-1 text-sm text-[#8B6B7B]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#D4607A]" aria-hidden />
              {store.address}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {store.openingHours ? (
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FCE4EC] px-3 py-1.5 text-xs font-semibold text-[#D4607A]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {store.openingHours}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-[#FFF5F7] px-3 py-1.5 text-xs text-[#8B6B7B]">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            Hours unavailable
          </span>
        )}
      </div>

      {store.notes ? (
        <p className="mt-3 rounded-2xl bg-[#FFF5F7] px-3 py-2 text-xs text-[#4A2D3A]">
          {store.notes}
        </p>
      ) : null}
    </article>
  );
}
