import { formatCurrency } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

interface PriceTableProps {
  deals: Deal[];
}

export function PriceTable({ deals }: PriceTableProps) {
  if (deals.length === 0) {
    return (
      <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 text-sm text-[#8B6B7B] shadow-sm">
        No price data available.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#F9D5E5] bg-white shadow-md shadow-rose-100/30">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#FFF5F7] text-[#8B6B7B]">
          <tr>
            <th className="px-4 py-3">Store</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Discount</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id} className="border-t border-[#F9D5E5]">
              <td className="px-4 py-3 font-medium text-[#4A2D3A]">{deal.store}</td>
              <td className="px-4 py-3 text-[#8B6B7B]">{deal.productName}</td>
              <td className="px-4 py-3 font-semibold text-[#4A2D3A]">
                {formatCurrency(deal.price)}
              </td>
              <td className="px-4 py-3 text-[#8B6B7B]">
                {deal.discountPercent ? `-${deal.discountPercent}%` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
