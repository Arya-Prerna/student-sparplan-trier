"use client";

import { cn } from "@/lib/utils";

export type AppTab = "search" | "meals" | "stores";

const TABS: Array<{ id: AppTab; label: string; description: string }> = [
  { id: "search", label: "Angebote suchen", description: "Finde den besten Preis" },
  { id: "meals", label: "Gunstig kochen", description: "Cheapest meals diese Woche" },
  { id: "stores", label: "Laden-Guide", description: "Offnungszeiten und Adressen" },
];

interface TabNavProps {
  value: AppTab;
  onChange: (tab: AppTab) => void;
}

export function TabNav({ value, onChange }: TabNavProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm sm:grid-cols-3">
      {TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-lg border px-4 py-3 text-left transition",
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
            )}
          >
            <p className="text-sm font-semibold">{tab.label}</p>
            <p className={cn("text-xs", active ? "text-zinc-200" : "text-zinc-500")}>
              {tab.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}

