"use client";

import { cn } from "@/lib/utils";

interface StoreFilterProps {
  stores: string[];
  selectedStore: string;
  onSelect: (store: string) => void;
}

/** Filter current search results by retailer chain (not product brand). */
export function StoreFilter({ stores, selectedStore, onSelect }: StoreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium transition",
          selectedStore === ""
            ? "border-[#D4607A] bg-[#D4607A] text-white"
            : "border-[#F9D5E5] bg-white text-[#4A2D3A] hover:bg-[#FFF5F7]"
        )}
      >
        All
      </button>
      {stores.map((store) => (
        <button
          key={store}
          type="button"
          onClick={() => onSelect(store)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition",
            selectedStore === store
              ? "border-[#D4607A] bg-[#D4607A] text-white"
              : "border-[#F9D5E5] bg-white text-[#4A2D3A] hover:bg-[#FFF5F7]"
          )}
        >
          {store}
        </button>
      ))}
    </div>
  );
}
