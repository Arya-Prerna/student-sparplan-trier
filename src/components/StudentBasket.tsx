import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

const STAPLE_ITEMS = [
  "milch",
  "brot",
  "eier",
  "pasta",
  "reis",
  "kartoffeln",
  "joghurt",
  "kaese",
  "tomaten",
  "haferflocken",
];

interface StudentBasketProps {
  deals: Deal[];
}

export function StudentBasket({ deals }: StudentBasketProps) {
  const byStore = new Map<string, number>();

  for (const item of STAPLE_ITEMS) {
    const cheapestForItem = deals
      .filter((deal) => deal.normalizedProductName.includes(item))
      .sort((a, b) => a.price - b.price);

    const best = cheapestForItem[0];
    if (!best) {
      continue;
    }

    byStore.set(best.store, (byStore.get(best.store) ?? 0) + best.price);
  }

  const totals = [...byStore.entries()]
    .map(([store, total]) => ({ store, total }))
    .sort((a, b) => a.total - b.total);

  return (
    <section className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/30">
      <h3 className="text-base font-semibold text-[#4A2D3A]">Sample student basket</h3>
      <p className="mt-1 text-sm text-[#8B6B7B]">
        Ten staple searches — which retailer looks cheapest for your current results?
      </p>

      <div className="mt-3 space-y-2">
        {totals.length === 0 ? (
          <p className="text-sm text-[#8B6B7B]">No matching deals for staples in this search yet.</p>
        ) : (
          totals.map((entry, index) => (
            <div
              key={entry.store}
              className="flex items-center justify-between rounded-xl border border-[#F9D5E5] bg-[#FFF5F7] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#E8879C]">#{index + 1}</span>
                <span className="text-sm font-medium text-[#4A2D3A]">{entry.store}</span>
              </div>
              <span className="text-sm font-semibold text-[#4A2D3A]">
                {formatCurrency(entry.total)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
