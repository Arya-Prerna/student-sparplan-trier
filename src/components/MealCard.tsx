import { ChefHat, Clock, Leaf, ShoppingBag, Users } from "lucide-react";

import { formatCurrency } from "@/lib/normalize";
import type { MealSuggestion } from "@/lib/types";

interface MealCardProps {
  meal: MealSuggestion;
}

function getDietaryBadge(nutritionalBenefit?: string, recipeName?: string) {
  const name = (recipeName ?? "").toLowerCase();
  const nut = (nutritionalBenefit ?? "").toLowerCase();
  if (name.includes("vegan") || nut.includes("vegan") || name.includes("veg ")) {
    return { label: "Vegan", color: "bg-emerald-100 text-emerald-700" };
  }
  if (
    name.includes("vegetarian") ||
    name.includes("spinat") ||
    name.includes("käse") ||
    name.includes("kase") ||
    name.includes("quark") ||
    name.includes("käsespätzle")
  ) {
    return { label: "Vegetarian", color: "bg-lime-100 text-lime-700" };
  }
  return null;
}

export function MealCard({ meal }: MealCardProps) {
  const dietary = getDietaryBadge(meal.nutritionalBenefit, meal.recipeName);
  const hasDiscount = meal.matchedIngredients.some((i) => (i.discountPercent ?? 0) > 0 && !i.priceIsEstimated);
  const realMatchCount = meal.matchedIngredients.filter((i) => !i.priceIsEstimated).length;

  return (
    <article className="overflow-hidden rounded-3xl border border-[#F9D5E5] bg-white shadow-[0_4px_20px_rgba(212,96,122,0.08)] transition-all duration-200 hover:shadow-[0_8px_30px_rgba(212,96,122,0.14)]">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#FFF0F3] to-[#FCE4EC] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <ChefHat className="h-5 w-5 text-[#D4607A]" aria-hidden />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4A2D3A] leading-snug">{meal.recipeName}</h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {dietary ? (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${dietary.color}`}>
                    <Leaf className="h-3 w-3" aria-hidden />
                    {dietary.label}
                  </span>
                ) : null}
                {hasDiscount ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Deal inside
                  </span>
                ) : null}
                {meal.nutritionalBenefit ? (
                  <span className="rounded-full bg-[#FCE4EC] px-2 py-0.5 text-[10px] font-medium text-[#D4607A]">
                    {meal.nutritionalBenefit.split("/")[0]}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-xl font-extrabold text-[#4A2D3A] tabular-nums">
              {formatCurrency(meal.estimatedTotalCost)}
            </p>
            <p className="text-[11px] text-[#8B6B7B]">total</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11px] text-[#8B6B7B]">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {meal.serves} servings
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {meal.prepMinutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            {formatCurrency(meal.estimatedCostPerServing)} /serving
          </span>
        </div>

        {typeof meal.bundleSavingsPercent === "number" && meal.bundleSavingsPercent > 0 ? (
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            ~{meal.bundleSavingsPercent.toFixed(0)}% below list prices
          </div>
        ) : null}
      </div>

      {/* Ingredients */}
      <div className="px-5 py-4">
        {meal.includesEstimatedPrices ? (
          <p className="mb-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Some prices are estimates where no live deal was matched.
          </p>
        ) : null}

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8B6B7B]">
          Ingredients · {realMatchCount}/{meal.matchedIngredients.length} matched live
        </p>

        <div className="space-y-2">
          {meal.matchedIngredients.map((ingredient) => (
            <div
              key={`${meal.recipeId}-${ingredient.ingredientName}`}
              className="flex items-center justify-between rounded-2xl border border-[#F9D5E5] bg-[#FFFAFB] px-3 py-2.5"
            >
              <div className="min-w-0 pr-2">
                <p className="text-[13px] font-semibold text-[#4A2D3A] leading-tight">
                  {ingredient.ingredientName}
                  <span className="ml-1 text-[11px] font-normal text-[#8B6B7B]">
                    ({ingredient.amount})
                  </span>
                </p>
                {ingredient.matchedProductName ? (
                  <p className="text-[11px] text-[#8B6B7B] leading-tight truncate">
                    {ingredient.matchedProductName}
                    {ingredient.priceIsEstimated ? (
                      <span className="ml-1 rounded bg-amber-100 px-1 text-amber-700">est.</span>
                    ) : null}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                {ingredient.store ? (
                  <span className="rounded-full bg-[#FCE4EC] px-2 py-0.5 text-[10px] font-semibold text-[#D4607A]">
                    {ingredient.store}
                  </span>
                ) : null}
                <span className="text-[13px] font-bold text-[#4A2D3A] tabular-nums">
                  {typeof ingredient.price === "number" ? formatCurrency(ingredient.price) : "—"}
                </span>
                {(ingredient.discountPercent ?? 0) > 0 && !ingredient.priceIsEstimated ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    -{ingredient.discountPercent}% off
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
