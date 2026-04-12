"use client";

import { cn } from "@/lib/utils";

export type AppTab = "search" | "meals" | "stores";

const TABS: Array<{ id: AppTab; label: string; description: string }> = [
  { id: "search", label: "Find deals", description: "Search current offers" },
  { id: "meals", label: "Budget meals", description: "Eight meals, cheapest first" },
  { id: "stores", label: "Store guide", description: "Hours & addresses" },
];

interface TabNavProps {
  value: AppTab;
  onChange: (tab: AppTab) => void;
}

export function TabNav({ value, onChange }: TabNavProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#F9D5E5] bg-white p-3 shadow-md shadow-rose-100/50 sm:grid-cols-3">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-xl border px-4 py-3 text-left transition",
              active
                ? "border-[#D4607A] bg-[#D4607A] text-white shadow-md"
                : "border-[#F9D5E5] bg-[#FFF5F7] text-[#4A2D3A] hover:bg-[#FCE4EC]"
            )}
          >
            <p className="text-sm font-semibold">{tab.label}</p>
            <p className={cn("text-xs", active ? "text-rose-100" : "text-[#8B6B7B]")}>
              {tab.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
