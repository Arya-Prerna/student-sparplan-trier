"use client";

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
  placeholder = "z. B. Milch, Eier, Pasta",
}: SearchBarProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit?.();
            }
          }}
          aria-label="Produkt suchen"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Suchen
        </button>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        Live-Suche uber Marktguru (54290): Ergebnisse nach kurzer Pause (~400 ms), gunstigste zuerst.
      </p>
    </div>
  );
}

