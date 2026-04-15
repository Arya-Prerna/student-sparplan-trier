"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { PriceTable } from "@/components/PriceTable";
import type { Deal } from "@/lib/types";

function CompareContent() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product")?.trim() || "milk";
  const zipCode = (searchParams.get("zipCode") ?? "54290").trim() || "54290";

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await fetch(
          `/api/deals?q=${encodeURIComponent(product)}&limit=40&zipCode=${encodeURIComponent(zipCode)}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as { deals?: Deal[]; error?: string; details?: string };
        if (!response.ok) {
          throw new Error(data.details ?? data.error ?? "Could not load prices.");
        }
        if (!cancelled) {
          setDeals((data.deals ?? []).sort((a, b) => a.price - b.price));
        }
      } catch (err) {
        if (!cancelled) {
          setDeals([]);
          setFetchError(err instanceof Error ? err.message : "Could not load prices.");
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
  }, [product, zipCode]);

  const heading = useMemo(() => product.trim() || "Product", [product]);

  return (
    <main className="min-h-screen bg-[#FFF5F7]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-[#4A2D3A]">Price compare: {heading}</h1>
        <p className="mt-2 text-sm text-[#8B6B7B]">
          Same search term across retailers for postal code {zipCode} — sorted cheapest first.
        </p>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-[#8B6B7B]">Loading comparison…</p>
          ) : fetchError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {fetchError}
            </div>
          ) : (
            <PriceTable deals={deals} />
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

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FFF5F7]">
          <div className="mx-auto w-full max-w-5xl px-4 py-8">
            <p className="text-sm text-[#8B6B7B]">Loading comparison…</p>
          </div>
        </main>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
