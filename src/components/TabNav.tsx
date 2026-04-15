"use client";

import { ChefHat, MapPin, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type AppTab = "search" | "meals" | "stores";

const TABS: Array<{ id: AppTab; label: string; description: string; icon: React.ElementType }> = [
  { id: "search", label: "Find deals", description: "Search current offers", icon: Search },
  { id: "meals", label: "Budget meals", description: "Eight meals, cheapest first", icon: ChefHat },
  { id: "stores", label: "Store guide", description: "Hours & addresses", icon: MapPin },
];

interface TabNavProps {
  value: AppTab;
  onChange: (tab: AppTab) => void;
}

export function TabNav({ value, onChange }: TabNavProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-3xl border border-[#F9D5E5] bg-white p-2 shadow-[0_4px_20px_rgba(212,96,122,0.08)]">
      {TABS.map((tab) => {
        const active = tab.id === value;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "group relative flex flex-col items-center gap-1.5 rounded-2xl px-3 py-3 text-center transition-all duration-200 cursor-pointer",
              active
                ? "bg-gradient-to-br from-[#D4607A] to-[#E8879C] text-white shadow-[0_4px_16px_rgba(212,96,122,0.35)]"
                : "text-[#4A2D3A] hover:bg-[#FFF5F7]"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                active ? "text-white" : "text-[#D4607A]"
              )}
              aria-hidden
            />
            <span className="text-xs font-semibold leading-tight">{tab.label}</span>
            <span className={cn("hidden text-[10px] leading-tight sm:block", active ? "text-rose-100" : "text-[#8B6B7B]")}>
              {tab.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
