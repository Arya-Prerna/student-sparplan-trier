"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PriceTable } from "@/components/PriceTable";
import type { Deal } from "@/lib/types";

export default function ComparePage() {
  const [product] = useState(() => {
    if (typeof window === "undefined") {
      return "milk";
    }

    const value = new URLSearchParams(window.location.search).get("product");
    return value?.trim() ? value.trim() : "milk";
  });
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const response = await fetch(`/api/deals?q=${encodeURIComponent(product)}&limit=40`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { deals?: Deal[] };
      if (!cancelled) {
        setDeals((data.deals ?? []).sort((a, b) => a.price - b.price));
        setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [product]);

  const heading = useMemo(() => product.trim() || "Product", [product]);

  return (
    <main className="min-h-screen bg-[#FFF5F7]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-[#4A2D3A]">Price compare: {heading}</h1>
        <p className="mt-2 text-sm text-[#8B6B7B]">
          Same search term across retailers — sorted cheapest first.
        </p>

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-[#8B6B7B]">Loading comparison…</p>
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
