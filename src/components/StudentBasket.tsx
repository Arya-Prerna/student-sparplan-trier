import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface StudentBasketProps {
  deals: Deal[];
}

/** Summary strip for the current search result list (not a persistent cart). */
export function StudentBasket({ deals }: StudentBasketProps) {
  if (deals.length === 0) {
    return null;
  }

  const total = deals.reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 text-sm text-[#4A2D3A] shadow-md shadow-rose-100/30">
      <p className="font-medium">Search basket (illustrative)</p>
      <p className="mt-1 text-[#8B6B7B]">
        {deals.length} offer{deals.length === 1 ? "" : "s"} in this result set · sum of listed prices{" "}
        <span className="font-semibold text-[#D4607A]">{formatCurrency(total)}</span> (not a checkout
        total).
      </p>
    </div>
  );
}
