import { ShoppingBasket } from "lucide-react";

import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface StudentBasketProps {
  deals: Deal[];
}

export function StudentBasket({ deals }: StudentBasketProps) {
  if (deals.length === 0) {
    return null;
  }

  const total = deals.reduce((sum, d) => sum + d.price, 0);

  return (
    <div className="flex items-center gap-4 rounded-3xl border border-[#F9D5E5] bg-white px-5 py-4 shadow-[0_4px_20px_rgba(212,96,122,0.07)]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-[#FCE4EC]">
        <ShoppingBasket className="h-5 w-5 text-[#D4607A]" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#4A2D3A]">Search results summary</p>
        <p className="text-xs text-[#8B6B7B]">
          {deals.length} offer{deals.length === 1 ? "" : "s"} found · sum of listed prices{" "}
          <span className="font-bold text-[#D4607A]">{formatCurrency(total)}</span>
        </p>
      </div>
    </div>
  );
}
