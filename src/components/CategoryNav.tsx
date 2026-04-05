"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: string[];
  selectedCategory: string;
}

export function CategoryNav({ categories, selectedCategory }: CategoryNavProps) {
  return (
    <nav className="flex flex-wrap gap-2">
      <Link
        href="/categories/all"
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-medium",
          selectedCategory === "all"
            ? "border-zinc-900 bg-zinc-900 text-white"
            : "border-zinc-300 bg-white text-zinc-700"
        )}
      >
        Alle Kategorien
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/categories/${encodeURIComponent(category)}`}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium",
            selectedCategory === category
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-300 bg-white text-zinc-700"
          )}
        >
          {category}
        </Link>
      ))}
    </nav>
  );
}

