"use client";

import Link from "next/link";
import {
  ChefHat,
  ExternalLink,
  Flame,
  ShoppingBasket,
  Sparkles,
  Tag,
  TrendingDown,
} from "lucide-react";
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

function DealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#F9D5E5] bg-white">
      <div className="h-28 animate-pulse bg-[#FCE4EC]/40" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-[#F9D5E5]" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-[#F9D5E5]" />
        <div className="h-6 w-1/3 animate-pulse rounded-full bg-[#F9D5E5]" />
      </div>
    </div>
  );
}

function MealCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#F9D5E5] bg-white">
      <div className="space-y-3 bg-gradient-to-r from-[#FFF0F3] to-[#FCE4EC] p-5">
        <div className="flex gap-3">
          <div className="h-10 w-10 animate-pulse rounded-2xl bg-[#FCE4EC]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#F9D5E5]" />
            <div className="h-3 w-1/3 animate-pulse rounded-full bg-[#F9D5E5]" />
          </div>
        </div>
      </div>
      <div className="space-y-2 p-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-[#FFF5F7]" />
        ))}
      </div>
    </div>
  );
}

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
      if (!response.ok) throw new Error(data.error ?? "Search failed");
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
      const data = (await response.json()) as { suggestions?: MealSuggestion[] };
      if (!response.ok) throw new Error("Could not load meals.");
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
      const response = await fetch(`/api/stores?zipCode=${encodeURIComponent(zipCode)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        stores?: StoreInfo[];
        relaxedPlzFilter?: boolean;
      };
      if (!response.ok) throw new Error("Could not load stores.");
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
      const response = await fetch(`/api/top-deals?zipCode=${encodeURIComponent(zipCode)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { deals?: Deal[] };
      if (!response.ok) throw new Error("Could not load top deals.");
      setTopDeals(data.deals ?? []);
    } catch {
      setTopDeals([]);
    } finally {
      setTopDealsLoading(false);
    }
  }, [zipCode]);

  useEffect(() => { void loadStores(); }, [loadStores]);
  useEffect(() => { void loadTopDeals(); }, [loadTopDeals]);
  useEffect(() => { void loadMeals(); }, [loadMeals]);
  useEffect(() => { setSelectedStore(""); }, [zipCode]);
  useEffect(() => {
    const handle = window.setTimeout(() => { void runSearch(); }, 400);
    return () => window.clearTimeout(handle);
  }, [runSearch]);

  const filteredDeals = useMemo(
    () => (selectedStore ? deals.filter((d) => d.store === selectedStore) : deals),
    [deals, selectedStore]
  );

  const storeNames = useMemo(
    () => [...new Set(deals.map((d) => d.store))].sort((a, b) => a.localeCompare(b)),
    [deals]
  );

  return (
    <div className="min-h-screen bg-[#FFF5F7]">
      {/* Decorative top stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#FCE4EC] via-[#D4607A] to-[#FCE4EC]" />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* ── Hero Header ── */}
        <header className="relative mb-6 overflow-hidden rounded-3xl border border-[#F9D5E5] bg-white shadow-[0_4px_24px_rgba(212,96,122,0.1)]">
          {/* Background blob decorations */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#FCE4EC]/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-[#FFF0F3]/80 blur-2xl" />

          <div className="relative px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-[#D4607A] to-[#E8879C] shadow-[0_4px_16px_rgba(212,96,122,0.35)]">
                  <ShoppingBasket className="h-7 w-7 text-white" aria-hidden />
                </div>
                <div>
                  <h1 className="flex flex-wrap items-center gap-2 text-2xl font-extrabold text-[#4A2D3A] sm:text-3xl">
                    Student Sparplan Trier
                    <Sparkles className="h-5 w-5 text-[#E8879C]" aria-hidden />
                  </h1>
                  <p className="mt-1 max-w-lg text-sm text-[#8B6B7B]">
                    Live deals · budget meals · store hours — everything a Trier student needs in one place.
                  </p>
                </div>
              </div>
              <ZipCodeSelector value={zipCode} onChange={setZipCode} />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#D4607A] to-[#E8879C] px-3 py-1 text-xs font-semibold text-white shadow-sm">
                <Sparkles className="h-3 w-3" aria-hidden />
                Trier · {zipCode}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9D5E5] bg-white px-3 py-1 text-xs font-medium text-[#8B6B7B]">
                <TrendingDown className="h-3 w-3 text-[#D4607A]" aria-hidden />
                Student budget first
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9D5E5] bg-white px-3 py-1 text-xs font-medium text-[#8B6B7B]">
                <ChefHat className="h-3 w-3 text-[#D4607A]" aria-hidden />
                Deal-aware recipes
              </span>
            </div>
          </div>
        </header>

        {/* ── Tab Navigation ── */}
        <div className="mb-6">
          <TabNav value={tab} onChange={setTab} />
        </div>

        {/* ── Tab Content ── */}
        <section className="space-y-5">
          {/* ─ Find Deals ─ */}
          {tab === "search" ? (
            <>
              {/* Top Discounts */}
              <div className="rounded-3xl border border-[#F9D5E5] bg-white p-5 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                    <Flame className="h-5 w-5 text-emerald-600" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#4A2D3A]">
                      Top Discounts ({zipCode})
                    </h2>
                    <p className="text-xs text-[#8B6B7B]">
                      Biggest savings near you · up to 12 offers · mixed across stores
                    </p>
                  </div>
                  {topDeals.length > 0 ? (
                    <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      {topDeals.length} deals
                    </span>
                  ) : null}
                </div>
                {topDealsLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => <DealCardSkeleton key={i} />)}
                  </div>
                ) : topDeals.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {topDeals.map((deal) => (
                      <DealCard key={`top-${deal.id}`} deal={deal} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#FFF5F7] py-8 text-center">
                    <Flame className="mx-auto mb-2 h-8 w-8 text-[#F9D5E5]" aria-hidden />
                    <p className="text-sm text-[#8B6B7B]">No discounted offers found for this area.</p>
                  </div>
                )}
              </div>

              {/* Search */}
              <div className="rounded-3xl border border-[#F9D5E5] bg-white p-5 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCE4EC]">
                    <Tag className="h-5 w-5 text-[#D4607A]" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#4A2D3A]">Search offers</h2>
                    <p className="text-xs text-[#8B6B7B]">Find any product across all stores</p>
                  </div>
                </div>
                <SearchBar value={query} onChange={setQuery} onSubmit={() => void runSearch()} />

                <div className="mt-4">
                  <StoreFilter
                    stores={storeNames}
                    selectedStore={selectedStore}
                    onSelect={setSelectedStore}
                  />
                </div>

                {error ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {error}
                  </div>
                ) : null}

                <div className="mt-4">
                  {searchLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3, 4, 5, 6].map((i) => <DealCardSkeleton key={i} />)}
                    </div>
                  ) : filteredDeals.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredDeals.slice(0, 24).map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                      ))}
                    </div>
                  ) : !searchLoading ? (
                    <p className="py-4 text-center text-sm text-[#8B6B7B]">
                      No offers found. Try another search term.
                    </p>
                  ) : null}
                </div>
              </div>

              <StudentBasket deals={deals} />
            </>
          ) : null}

          {/* ─ Budget Meals ─ */}
          {tab === "meals" ? (
            <>
              <div className="rounded-3xl border border-[#F9D5E5] bg-white p-5 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FCE4EC]">
                    <ChefHat className="h-5 w-5 text-[#D4607A]" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#4A2D3A]">Budget meals this week</h2>
                    <p className="text-xs text-[#8B6B7B]">
                      8 meals for {zipCode} · cheapest first · at least 3 veg/vegan · live deal prices
                    </p>
                  </div>
                  {meals.length > 0 ? (
                    <span className="ml-auto rounded-full bg-[#FCE4EC] px-3 py-1 text-xs font-bold text-[#D4607A]">
                      {meals.length} meals
                    </span>
                  ) : null}
                </div>
              </div>

              {mealsLoading ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => <MealCardSkeleton key={i} />)}
                </div>
              ) : meals.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {meals.map((meal) => (
                    <MealCard key={meal.recipeId} meal={meal} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-[#F9D5E5] bg-white p-10 text-center shadow-sm">
                  <ChefHat className="mx-auto mb-3 h-12 w-12 text-[#F9D5E5]" aria-hidden />
                  <p className="text-sm text-[#8B6B7B]">
                    No meals available. Check deal data for your postal code.
                  </p>
                </div>
              )}
            </>
          ) : null}

          {/* ─ Store Guide ─ */}
          {tab === "stores" ? (
            <StoreGuide
              stores={stores}
              loading={storesLoading}
              zipCode={zipCode}
              relaxedPlzFilter={storeGuideRelaxed}
            />
          ) : null}
        </section>

        {/* ── Footer ── */}
        <footer className="mt-8 rounded-3xl border border-[#F9D5E5] bg-white px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-[#D4607A]" aria-hidden />
              <span className="text-xs font-semibold text-[#4A2D3A]">Student Sparplan Trier</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#8B6B7B]">
              <Link
                className="inline-flex items-center gap-1 font-medium text-[#D4607A] transition hover:text-[#c5556e]"
                href="/compare?product=milk"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                Price compare
              </Link>
              <Link
                className="inline-flex items-center gap-1 font-medium text-[#D4607A] transition hover:text-[#c5556e]"
                href="/deals/lidl"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                Deals by store
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
