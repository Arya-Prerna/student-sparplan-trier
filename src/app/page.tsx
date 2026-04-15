"use client";

import Link from "next/link";
import { ShoppingBasket, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DealCard } from "@/components/DealCard";
import { MealCard } from "@/components/MealCard";
import { SearchBar } from "@/components/SearchBar";
import { StoreGuide } from "@/components/StoreGuide";
import { StoreFilter } from "@/components/StoreFilter";
import { StudentBasket } from "@/components/StudentBasket";
import { TabNav, type AppTab } from "@/components/TabNav";
import { ZipCodeSelector } from "@/components/ZipCodeSelector";
import type { Deal, MealSuggestion, StoreInfo } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState<AppTab>("search");
  const [zipCode, setZipCode] = useState("54290");
  const [query, setQuery] = useState("milk");
  const [selectedStore, setSelectedStore] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [topDealsLoading, setTopDealsLoading] = useState(false);
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [storeGuideRelaxed, setStoreGuideRelaxed] = useState(false);
  const [meals, setMeals] = useState<MealSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [storesLoading, setStoresLoading] = useState(false);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    if (!query.trim()) {
      setDeals([]);
      return;
    }

    setSearchLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}&limit=30&zipCode=${encodeURIComponent(zipCode)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as { deals?: Deal[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Search failed");
      }
      setDeals(data.deals ?? []);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Search failed");
      setDeals([]);
    } finally {
      setSearchLoading(false);
    }
  }, [query, zipCode]);

  const loadMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const response = await fetch(`/api/meals?zipCode=${encodeURIComponent(zipCode)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        suggestions?: MealSuggestion[];
      };
      if (!response.ok) {
        throw new Error("Could not load meals.");
      }
      setMeals(data.suggestions ?? []);
    } catch {
      setMeals([]);
    } finally {
      setMealsLoading(false);
    }
  }, [zipCode]);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const response = await fetch(
        `/api/stores?zipCode=${encodeURIComponent(zipCode)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as {
        stores?: StoreInfo[];
        relaxedPlzFilter?: boolean;
      };
      if (!response.ok) {
        throw new Error("Could not load stores.");
      }
      setStores(data.stores ?? []);
      setStoreGuideRelaxed(Boolean(data.relaxedPlzFilter));
    } catch {
      setStores([]);
      setStoreGuideRelaxed(false);
    } finally {
      setStoresLoading(false);
    }
  }, [zipCode]);

  const loadTopDeals = useCallback(async () => {
    setTopDealsLoading(true);
    try {
      const response = await fetch(
        `/api/top-deals?zipCode=${encodeURIComponent(zipCode)}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as { deals?: Deal[] };
      if (!response.ok) {
        throw new Error("Could not load top deals.");
      }
      setTopDeals(data.deals ?? []);
    } catch {
      setTopDeals([]);
    } finally {
      setTopDealsLoading(false);
    }
  }, [zipCode]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    void loadTopDeals();
  }, [loadTopDeals]);

  useEffect(() => {
    void loadMeals();
  }, [loadMeals]);

  useEffect(() => {
    setSelectedStore("");
  }, [zipCode]);

  /** Debounced search (~400 ms). */
  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runSearch();
    }, 400);
    return () => window.clearTimeout(handle);
  }, [runSearch]);

  const filteredDeals = useMemo(() => {
    if (!selectedStore) {
      return deals;
    }

    return deals.filter((deal) => deal.store === selectedStore);
  }, [deals, selectedStore]);

  const storeNames = useMemo(
    () => [...new Set(deals.map((deal) => deal.store))].sort((a, b) => a.localeCompare(b)),
    [deals]
  );

  return (
    <div className="min-h-screen bg-[#FFF5F7]">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6 rounded-2xl border border-[#F9D5E5] bg-white p-6 shadow-md shadow-rose-100/50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FCE4EC] text-[#D4607A]">
                <ShoppingBasket className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold text-[#4A2D3A] sm:text-3xl">
                  Student Sparplan Trier
                  <Sparkles className="h-5 w-5 text-[#E8879C]" aria-hidden />
                </h1>
                <p className="mt-2 max-w-3xl text-sm text-[#8B6B7B] sm:text-base">
                  Compare live offers, cook on a budget, and check store hours — one cute page for
                  students in the Trier area.
                </p>
              </div>
            </div>
            <ZipCodeSelector value={zipCode} onChange={setZipCode} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#8B6B7B]">
            <span className="rounded-full bg-[#FCE4EC] px-3 py-1 font-medium text-[#D4607A]">
              Trier region · {zipCode}
            </span>
            <span className="rounded-full bg-[#FFF5F7] px-3 py-1">Student budget first</span>
            <span className="rounded-full bg-[#FFF5F7] px-3 py-1">Deal-aware recipes</span>
          </div>
        </header>

        <div className="mb-6">
          <TabNav value={tab} onChange={setTab} />
        </div>

        <section className="space-y-4">
          {tab === "search" ? (
            <>
              <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/40">
                <h2 className="text-lg font-semibold text-[#4A2D3A]">
                  Top Discounts ({zipCode})
                </h2>
                <p className="mt-1 text-sm text-[#8B6B7B]">
                  Highest discount % near postal code {zipCode}, mixed across stores (up to 12 offers).
                </p>
                {topDealsLoading ? (
                  <p className="mt-3 text-sm text-[#8B6B7B]">Loading top deals…</p>
                ) : (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topDeals.map((deal) => (
                      <DealCard key={`top-${deal.id}`} deal={deal} />
                    ))}
                  </div>
                )}
                {!topDealsLoading && topDeals.length === 0 ? (
                  <p className="mt-3 text-sm text-[#8B6B7B]">No discounted offers found for this area.</p>
                ) : null}
              </div>

              <SearchBar value={query} onChange={setQuery} onSubmit={() => void runSearch()} />
              <StoreFilter
                stores={storeNames}
                selectedStore={selectedStore}
                onSelect={setSelectedStore}
              />

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              {searchLoading ? (
                <p className="text-sm text-[#8B6B7B]">Searching…</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDeals.slice(0, 24).map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}

              {!searchLoading && filteredDeals.length === 0 ? (
                <p className="text-sm text-[#8B6B7B]">No offers found. Try another search term.</p>
              ) : null}

              <StudentBasket deals={deals} />
            </>
          ) : null}

          {tab === "meals" ? (
            <>
              <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/40">
                <h2 className="text-lg font-semibold text-[#4A2D3A]">Budget meals this week</h2>
                <p className="mt-1 text-sm text-[#8B6B7B]">
                  Eight curated meals for your postal code, cheapest first. Each includes at least one
                  discounted ingredient; at least three are vegetarian or vegan. Totals use estimates
                  when no offer matches an ingredient.
                </p>
              </div>

              {mealsLoading ? (
                <p className="text-sm text-[#8B6B7B]">Calculating meals…</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {meals.map((meal) => (
                    <MealCard key={meal.recipeId} meal={meal} />
                  ))}
                </div>
              )}

              {!mealsLoading && meals.length === 0 ? (
                <p className="text-sm text-[#8B6B7B]">
                  No meals available. Check deal data for your postal code.
                </p>
              ) : null}
            </>
          ) : null}

          {tab === "stores" ? (
            <StoreGuide
              stores={stores}
              loading={storesLoading}
              zipCode={zipCode}
              relaxedPlzFilter={storeGuideRelaxed}
            />
          ) : null}
        </section>

        <footer className="mt-10 rounded-2xl border border-[#F9D5E5] bg-white p-4 text-xs text-[#8B6B7B] shadow-sm">
          <p>
            More:{" "}
            <Link className="font-medium text-[#D4607A] underline" href="/compare?product=milk">
              Price compare
            </Link>{" "}
            ·{" "}
            <Link className="font-medium text-[#D4607A] underline" href="/deals/lidl">
              Deals by store
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
