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
  placeholder = "e.g. milk, eggs, pasta",
}: SearchBarProps) {
  return (
    <div className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/40">
      <div className="flex flex-col gap-3 sm:flex-row">
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
          className="w-full rounded-xl border border-[#F9D5E5] bg-white px-4 py-2 text-sm text-[#4A2D3A] outline-none transition focus:border-[#E8879C] focus:ring-2 focus:ring-[#FCE4EC]"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-xl bg-[#D4607A] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#c5556e]"
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-[#8B6B7B]">
        Live search via Marktguru (~400 ms debounce). Results: cheapest first. Discount end date on each card.
      </p>
    </div>
  );
}
