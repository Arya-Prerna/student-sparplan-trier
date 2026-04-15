"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search for milk, eggs, pizza…",
}: SearchBarProps) {
  return (
    <div className="rounded-3xl border border-[#F9D5E5] bg-white p-4 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4607A]"
            aria-hidden
          />
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onSubmit?.();
              }
            }}
            aria-label="Search products"
            autoComplete="off"
            className="w-full rounded-2xl border border-[#F9D5E5] bg-[#FFFAFB] py-3 pl-11 pr-4 text-sm text-[#4A2D3A] outline-none transition focus:border-[#E8879C] focus:bg-white focus:ring-2 focus:ring-[#FCE4EC]"
            placeholder={placeholder}
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#D4607A] to-[#E8879C] px-5 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(212,96,122,0.3)] transition-all duration-200 hover:shadow-[0_6px_16px_rgba(212,96,122,0.4)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#8B6B7B]">
        Live search via Marktguru · ~400 ms debounce · Results cheapest first
      </p>
    </div>
  );
}
