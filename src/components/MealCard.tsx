import { formatCurrency } from "@/lib/normalize";
import type { MealSuggestion } from "@/lib/types";

interface MealCardProps {
  meal: MealSuggestion;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <article className="rounded-2xl border border-[#F9D5E5] bg-white p-4 shadow-md shadow-rose-100/30">
      <p className="mb-2 rounded-xl bg-[#FCE4EC] px-3 py-2 text-sm font-medium text-[#4A2D3A]">
        This week you can cook{" "}
        <span className="font-semibold text-[#D4607A]">{meal.recipeName}</span> for about{" "}
        {formatCurrency(meal.estimatedTotalCost)} total.
      </p>
      {meal.includesEstimatedPrices ? (
        <p className="mb-2 text-xs text-[#8B6B7B]">
          * Total includes placeholder prices where no current deal matched — see ingredient notes.
        </p>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#4A2D3A]">{meal.recipeName}</h3>
          <p className="text-xs text-[#8B6B7B]">
            {meal.serves} servings · {meal.prepMinutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[#4A2D3A]">
            {formatCurrency(meal.estimatedTotalCost)}
          </p>
          <p className="text-xs text-[#8B6B7B]">
            {formatCurrency(meal.estimatedCostPerServing)} per serving
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm text-[#8B6B7B]">{meal.reason}</p>

      <div className="mt-3 space-y-2">
        {meal.matchedIngredients.map((ingredient) => (
          <div
            key={`${meal.recipeId}-${ingredient.ingredientName}`}
            className="flex items-center justify-between rounded-xl border border-[#F9D5E5] bg-[#FFF5F7] px-3 py-2"
          >
            <div className="min-w-0 pr-2">
              <p className="text-sm font-medium text-[#4A2D3A]">
                {ingredient.ingredientName}{" "}
                <span className="text-[#8B6B7B]">({ingredient.amount})</span>
              </p>
              <p className="text-xs text-[#8B6B7B]">
                {ingredient.matchedProductName ?? "No match"}
                {ingredient.priceIsEstimated ? (
                  <span className="ml-1 text-[#D4607A]">(est.)</span>
                ) : null}
              </p>
              {ingredient.note ? (
                <p className="text-xs text-[#8B6B7B]">{ingredient.note}</p>
              ) : null}
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right text-xs text-[#8B6B7B]">
              {ingredient.store ? (
                <span className="inline-block rounded-full bg-[#FCE4EC] px-2 py-0.5 font-medium text-[#D4607A]">
                  {ingredient.store}
                </span>
              ) : (
                <span>—</span>
              )}
              <span className="font-semibold text-[#4A2D3A]">
                {typeof ingredient.price === "number" ? formatCurrency(ingredient.price) : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
