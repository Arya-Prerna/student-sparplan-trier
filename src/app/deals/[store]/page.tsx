"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { DealCard } from "@/components/DealCard";
import { StoreFilter } from "@/components/StoreFilter";
import type { Deal } from "@/lib/types";

function DealsByStoreContent() {
  const params = useParams<{ store: string }>();
  const searchParams = useSearchParams();
  const storeFromPath = decodeURIComponent(params.store ?? "");
  const zipCode = (searchParams.get("zipCode") ?? "54290").trim() || "54290";

  const [selectedStore, setSelectedStore] = useState(storeFromPath);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStore(storeFromPath);
  }, [storeFromPath]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFetchError(null);
      const zipQ = `&zipCode=${encodeURIComponent(zipCode)}`;
      const query = selectedStore
        ? `/api/deals?store=${encodeURIComponent(selectedStore)}&limit=80${zipQ}`
        : `/api/deals?limit=80${zipQ}`;
      try {
        const response = await fetch(query, { cache: "no-store" });
        const data = (await response.json()) as { deals?: Deal[]; error?: string; details?: string };
        if (!response.ok) {
          throw new Error(data.details ?? data.error ?? "Could not load deals.");
        }
        if (!cancelled) {
          setDeals(data.deals ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setDeals([]);
          setFetchError(err instanceof Error ? err.message : "Could not load deals.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedStore, zipCode]);

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
          Current offers for the selected chain (postal code {zipCode}).
        </p>

        <div className="mt-4">
          <StoreFilter stores={stores} selectedStore={selectedStore} onSelect={setSelectedStore} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-sm text-[#8B6B7B] sm:col-span-2 lg:col-span-3">Loading deals…</p>
          ) : fetchError ? (
            <div className="sm:col-span-2 lg:col-span-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {fetchError}
            </div>
          ) : deals.length === 0 ? (
            <p className="text-sm text-[#8B6B7B] sm:col-span-2 lg:col-span-3">No deals found.</p>
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

export default function DealsByStorePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FFF5F7]">
          <div className="mx-auto w-full max-w-6xl px-4 py-8">
            <p className="text-sm text-[#8B6B7B]">Loading deals…</p>
          </div>
        </main>
      }
    >
      <DealsByStoreContent />
    </Suspense>
  );
}
