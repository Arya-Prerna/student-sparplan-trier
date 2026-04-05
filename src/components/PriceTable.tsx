import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface PriceTableProps {
  deals: Deal[];
}

export function PriceTable({ deals }: PriceTableProps) {
  if (deals.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">
        Keine Preisdaten verfugbar.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-zinc-600">
          <tr>
            <th className="px-4 py-3">Markt</th>
            <th className="px-4 py-3">Produkt</th>
            <th className="px-4 py-3">Preis</th>
            <th className="px-4 py-3">Rabatt</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-t border-zinc-100">
              <td className="px-4 py-3 font-medium text-zinc-900">{deal.store}</td>
              <td className="px-4 py-3 text-zinc-700">{deal.productName}</td>
              <td className="px-4 py-3 font-semibold text-zinc-900">
                {formatCurrency(deal.price)}
              </td>
              <td className="px-4 py-3 text-zinc-700">
                {deal.discountPercent ? `-${deal.discountPercent}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

