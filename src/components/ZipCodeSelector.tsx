"use client";

/** Trier core + nearby postal codes (Marktguru coverage is regional). */
export const ZIP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "54290", label: "54290 — Trier (center)" },
  { value: "54292", label: "54292 — Trier (north)" },
  { value: "54293", label: "54293 — Trier (east)" },
  { value: "54294", label: "54294 — Trier (south)" },
  { value: "54295", label: "54295 — Trier (Tarforst)" },
  { value: "54296", label: "54296 — Trier (Tarforst)" },
  { value: "54306", label: "54306 — Kenn" },
  { value: "54308", label: "54308 — Langsur" },
  { value: "54309", label: "54309 — Newel" },
];

interface ZipCodeSelectorProps {
  value: string;
  onChange: (zip: string) => void;
}

export function ZipCodeSelector({ value, onChange }: ZipCodeSelectorProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[#4A2D3A]">Postal Code</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full max-w-xs rounded-xl border border-[#F9D5E5] bg-white px-3 py-2 text-[#4A2D3A] shadow-sm outline-none transition focus:border-[#E8879C] focus:ring-2 focus:ring-[#FCE4EC] sm:w-auto"
      >
        {ZIP_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
