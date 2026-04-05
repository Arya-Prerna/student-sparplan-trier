"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { CategoryNav } from "@/components/CategoryNav";
import { DealCard } from "@/components/DealCard";
import type { Deal } from "@/lib/types";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug ?? "all");

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      const query =
        slug === "all"
          ? "/api/deals?limit=60"
          : `/api/deals?category=${encodeURIComponent(slug)}&limit=60`;
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
  }, [slug]);

  const categories = useMemo(
    () =>
      [...new Set(deals.map((deal) => deal.category).filter(Boolean) as string[])].sort((a, b) =>
        a.localeCompare(b)
      ),
    [deals]
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-zinc-900">
        Kategorie: {slug === "all" ? "Alle" : slug}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">Deals nach Kategorie filtern und vergleichen.</p>

      <div className="mt-4">
        <CategoryNav categories={categories} selectedCategory={slug} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="text-sm text-zinc-500">Kategorien werden geladen...</p>
        ) : deals.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine Deals in dieser Kategorie gefunden.</p>
        ) : (
          deals.map((deal) => <DealCard key={deal.id} deal={deal} />)
        )}
      </div>

      <Link href="/" className="mt-6 inline-block text-sm text-zinc-700 underline">
        Zuruck zur Startseite
      </Link>
    </main>
  );
}

