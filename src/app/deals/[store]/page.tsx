"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { DealCard } from "@/components/DealCard";
import { StoreFilter } from "@/components/StoreFilter";
import type { Deal } from "@/lib/types";

export default function DealsByStorePage() {
  const params = useParams<{ store: string }>();
  const storeFromPath = decodeURIComponent(params.store ?? "");

  const [selectedStore, setSelectedStore] = useState(storeFromPath);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSelectedStore(storeFromPath);
  }, [storeFromPath]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const query = selectedStore
        ? `/api/deals?store=${encodeURIComponent(selectedStore)}&limit=80`
        : "/api/deals?limit=80";
      const response = await fetch(query, { cache: "no-store" });
      const data = (await response.json()) as { deals?: Deal[] };
      if (!cancelled) {
        setDeals(data.deals ?? []);
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedStore]);

  const stores = useMemo(
    () => [...new Set(deals.map((deal) => deal.store))].sort((a, b) => a.localeCompare(b)),
    [deals]
  );

  return (
    <main className="min-h-screen bg-[#FFF5F7]">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-[#4A2D3A]">
          Deals by store{selectedStore ? `: ${selectedStore}` : ""}
        </h1>
        <p className="mt-2 text-sm text-[#8B6B7B]">
          Current offers for the selected supermarket chain.
        </p>

        <div className="mt-4">
          <StoreFilter stores={stores} selectedStore={selectedStore} onSelect={setSelectedStore} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-sm text-[#8B6B7B]">Loading deals…</p>
          ) : deals.length === 0 ? (
            <p className="text-sm text-[#8B6B7B]">No deals found.</p>
          ) : (
            deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
          )}
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm font-medium text-[#D4607A] underline"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
