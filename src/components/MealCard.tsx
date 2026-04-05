import { formatCurrency } from "@/lib/normalize";
import type { MealSuggestion } from "@/lib/types";

interface MealCardProps {
  meal: MealSuggestion;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{meal.recipeName}</h3>
          <p className="text-xs text-zinc-500">
            {meal.serves} Portionen · {meal.prepMinutes} min
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-zinc-900">
            {formatCurrency(meal.estimatedTotalCost)}
          </p>
          <p className="text-xs text-zinc-500">
            {formatCurrency(meal.estimatedCostPerServing)} pro Portion
          </p>
        </div>
      </div>

      <p className="mt-2 text-sm text-zinc-700">{meal.reason}</p>

      <div className="mt-3 space-y-2">
        {meal.matchedIngredients.map((ingredient) => (
          <div
            key={`${meal.recipeId}-${ingredient.ingredientName}`}
            className="flex items-center justify-between rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-zinc-900">
                {ingredient.ingredientName} ({ingredient.amount})
              </p>
              <p className="text-xs text-zinc-500">
                {ingredient.matchedProductName ?? "Kein Match"}
              </p>
            </div>
            <div className="text-right text-xs text-zinc-600">
              <p>{ingredient.store ?? "—"}</p>
              <p className="font-semibold text-zinc-800">
                {typeof ingredient.price === "number" ? formatCurrency(ingredient.price) : "—"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

