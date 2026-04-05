"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DealCard } from "@/components/DealCard";
import { MealCard } from "@/components/MealCard";
import { SearchBar } from "@/components/SearchBar";
import { StoreCard } from "@/components/StoreCard";
import { StoreFilter } from "@/components/StoreFilter";
import { StudentBasket } from "@/components/StudentBasket";
import { TabNav, type AppTab } from "@/components/TabNav";
import type { Deal, MealSuggestion, StoreInfo } from "@/lib/types";

export default function Home() {
  const [tab, setTab] = useState<AppTab>("search");
  const [query, setQuery] = useState("milch");
  const [selectedStore, setSelectedStore] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stores, setStores] = useState<StoreInfo[]>([]);
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
        `/api/search?q=${encodeURIComponent(query.trim())}&limit=30`,
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
  }, [query]);

  const loadMeals = useCallback(async () => {
    setMealsLoading(true);
    try {
      const response = await fetch("/api/meals", { cache: "no-store" });
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
  }, []);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const response = await fetch("/api/stores", { cache: "no-store" });
      const data = (await response.json()) as { stores?: StoreInfo[] };
      if (!response.ok) {
        throw new Error("Could not load stores.");
      }
      setStores(data.stores ?? []);
    } catch {
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    void runSearch();
    void loadMeals();
    void loadStores();
  }, [loadMeals, loadStores, runSearch]);

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
    <div className="min-h-screen bg-zinc-50">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <header className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Student Sparplan Trier</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-600 sm:text-base">
            Vergleiche aktuelle Angebote, finde gunstige Mahlzeiten und checke Offnungszeiten -
            alles fur Trier, alles auf einer Seite.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-3 py-1">Trier · 54290</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">Student budget first</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">Weekly deal aware</span>
          </div>
        </header>

        <div className="mb-6">
          <TabNav value={tab} onChange={setTab} />
        </div>

        <section className="space-y-4">
          {tab === "search" ? (
            <>
              <SearchBar value={query} onChange={setQuery} onSubmit={() => void runSearch()} />
              <StoreFilter
                stores={storeNames}
                selectedStore={selectedStore}
                onSelect={setSelectedStore}
              />

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {searchLoading ? (
                <p className="text-sm text-zinc-500">Suche lauf...</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDeals.slice(0, 24).map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
              )}

              {!searchLoading && filteredDeals.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Keine Angebote gefunden. Probiere einen anderen Suchbegriff.
                </p>
              ) : null}

              <StudentBasket deals={deals} />
            </>
          ) : null}

          {tab === "meals" ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900">Cheapest Meals This Week</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Hand-kuratierte Rezepte + aktuelle Angebote + Haiku-Matching.
                </p>
              </div>

              {mealsLoading ? (
                <p className="text-sm text-zinc-500">Mahlzeiten werden berechnet...</p>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {meals.map((meal) => (
                    <MealCard key={meal.recipeId} meal={meal} />
                  ))}
                </div>
              )}

              {!mealsLoading && meals.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Noch keine Mahlzeiten verfugbar. Prufe API-Schlussel und Deal-Daten.
                </p>
              ) : null}
            </>
          ) : null}

          {tab === "stores" ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-zinc-900">Store Guide Trier</h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Adressen + Offnungszeiten aus OpenStreetMap Overpass API.
                </p>
              </div>

              {storesLoading ? (
                <p className="text-sm text-zinc-500">Ladeninfos werden geladen...</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {stores.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}

              {!storesLoading && stores.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  Keine Ladeninfos verfugbar. Overpass API war moglicherweise nicht erreichbar.
                </p>
              ) : null}
            </>
          ) : null}
        </section>

        <footer className="mt-10 rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
          <p>
            Erweiterte Ansichten:{" "}
            <Link className="text-zinc-800 underline" href="/compare?product=milch">
              Preisvergleich
            </Link>{" "}
            ·{" "}
            <Link className="text-zinc-800 underline" href="/categories/all">
              Kategorien
            </Link>{" "}
            ·{" "}
            <Link className="text-zinc-800 underline" href="/deals/lidl">
              Deals pro Markt
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
