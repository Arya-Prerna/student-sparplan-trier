"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PriceTable } from "@/components/PriceTable";
import type { Deal } from "@/lib/types";

export default function ComparePage() {
  const [product] = useState(() => {
    if (typeof window === "undefined") {
      return "milch";
    }

    const value = new URLSearchParams(window.location.search).get("product");
    return value?.trim() ? value.trim() : "milch";
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

  const heading = useMemo(() => product.trim() || "Produkt", [product]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">Preisvergleich: {heading}</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Gleicher Suchbegriff, mehrere Markte, nach Preis sortiert.
      </p>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-zinc-500">Vergleich wird geladen...</p>
        ) : (
          <PriceTable deals={deals} />
        )}
      </div>

      <Link href="/" className="mt-6 inline-block text-sm text-zinc-700 underline">
        Zuruck zur Startseite
      </Link>
    </main>
  );
}

