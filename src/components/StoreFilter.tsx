"use client";

import { cn } from "@/lib/utils";

interface StoreFilterProps {
  stores: string[];
  selectedStore: string;
  onSelect: (store: string) => void;
}

export function StoreFilter({ stores, selectedStore, onSelect }: StoreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium",
          selectedStore === ""
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white text-zinc-700"
        )}
      >
        Alle
      </button>
      {stores.map((store) => (
        <button
          key={store}
          type="button"
          onClick={() => onSelect(store)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            selectedStore === store
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white text-zinc-700"
          )}
        >
          {store}
        </button>
      ))}
    </div>
  );
}

