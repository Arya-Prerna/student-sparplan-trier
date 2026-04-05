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
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-base font-semibold text-zinc-900">Student Basket (Demo)</h3>
      <p className="mt-1 text-sm text-zinc-600">
        Beispielkorb aus 10 Basics. Zeigt, welcher Markt aktuell am gunstigsten ist.
      </p>

      <div className="mt-3 space-y-2">
        {totals.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine passenden Deals gefunden.</p>
        ) : (
          totals.map((entry, index) => (
            <div
              key={entry.store}
              className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">#{index + 1}</span>
                <span className="text-sm font-medium text-zinc-900">{entry.store}</span>
              </div>
              <span className="text-sm font-semibold text-zinc-900">
                {formatCurrency(entry.total)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

