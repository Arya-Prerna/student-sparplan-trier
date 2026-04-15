"use client";

import { cn } from "@/lib/utils";

interface StoreFilterProps {
  stores: string[];
  selectedStore: string;
  onSelect: (store: string) => void;
}

export function StoreFilter({ stores, selectedStore, onSelect }: StoreFilterProps) {
  if (stores.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={cn(
          "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
          selectedStore === ""
            ? "border-[#D4607A] bg-gradient-to-r from-[#D4607A] to-[#E8879C] text-white shadow-[0_3px_10px_rgba(212,96,122,0.3)]"
            : "border-[#F9D5E5] bg-white text-[#4A2D3A] hover:bg-[#FFF5F7] hover:border-[#E8879C]"
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
            "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer",
            selectedStore === store
              ? "border-[#D4607A] bg-gradient-to-r from-[#D4607A] to-[#E8879C] text-white shadow-[0_3px_10px_rgba(212,96,122,0.3)]"
              : "border-[#F9D5E5] bg-white text-[#4A2D3A] hover:bg-[#FFF5F7] hover:border-[#E8879C]"
          )}
        >
          {store}
        </button>
      ))}
    </div>
  );
}
