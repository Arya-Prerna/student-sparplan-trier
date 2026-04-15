import { normalizeText } from "@/lib/normalize";
import type { Deal, MatchedIngredient, MealSuggestion, Recipe } from "@/lib/types";

const MEAL_TARGET_MIN = 8;
const MEAL_TARGET_MAX = 8;

function buildIngredientTokens(name: string) {
  const normalized = normalizeText(name);
  return normalized.split(" ").filter((token) => token.length >= 3);
}

/** Placeholder EUR per ingredient when no current deal matches (keeps totals honest). */
const ESTIMATED_FALLBACK_EUR = 1.5;

function parsePreferredStores(source?: string): string[] {
  if (!source?.trim() || normalizeText(source) === "any") {
    return [];
  }
  return source
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function dealMatchesPreferredRetailers(deal: Deal, preferred: string[]): boolean {
  if (preferred.length === 0) {
    return false;
  }
  const dn = normalizeText(deal.store);
  return preferred.some((p) => {
    const pn = normalizeText(p);
    if (pn.length < 2) {
      return false;
    }
    return dn.includes(pn) || pn.includes(dn);
  });
}

function fallbackMatchIngredient(
  ingredient: string,
  deals: Deal[],
  preferredRetailers: string[]
): Deal | undefined {
  const tokens = buildIngredientTokens(ingredient);
  if (tokens.length === 0) {
    const norm = normalizeText(ingredient);
    if (norm.length >= 3) {
      tokens.push(norm);
    }
  }

  const matches = deals.filter((deal) =>
    tokens.some((token) => deal.normalizedProductName.includes(token))
  );

  if (matches.length === 0) {
    return undefined;
  }

  const preferred = matches.filter((m) =>
    dealMatchesPreferredRetailers(m, preferredRetailers)
  );
  const pool = preferred.length > 0 ? preferred : matches;
  return [...pool].sort((a, b) => a.price - b.price)[0];
}

function postProcessMealSuggestions(suggestions: MealSuggestion[]): MealSuggestion[] {
  return suggestions.map((meal) => {
    let filledMissingPrice = false;
    const matchedIngredients: MatchedIngredient[] = meal.matchedIngredients.map(
      (ing) => {
        if (typeof ing.price === "number" && ing.price > 0) {
          return { ...ing };
        }
        filledMissingPrice = true;
        return {
          ...ing,
          price: ESTIMATED_FALLBACK_EUR,
          priceIsEstimated: true,
          note:
            ing.note ??
            "Estimated (no matching deal found this week).",
        };
      }
    );

    const total = matchedIngredients.reduce(
      (sum, item) => sum + (item.price ?? 0),
      0
    );
    const includesEstimatedPrices = matchedIngredients.some(
      (item) => item.priceIsEstimated
    );

    return {
      ...meal,
      matchedIngredients,
      estimatedTotalCost: Number(total.toFixed(2)),
      estimatedCostPerServing: Number((total / meal.serves).toFixed(2)),
      includesEstimatedPrices,
      stores: [
        ...new Set(
          matchedIngredients
            .map((item) => item.store)
            .filter((value): value is string => Boolean(value))
        ),
      ],
      reason: filledMissingPrice
        ? `${meal.reason} Totals include €${ESTIMATED_FALLBACK_EUR.toFixed(2)} placeholder prices where no offer matched.`
        : meal.reason,
    };
  });
}

function findDealForIngredient(ing: MatchedIngredient, deals: Deal[]): Deal | undefined {
  if (!ing.matchedProductName || !ing.store || ing.priceIsEstimated) {
    return undefined;
  }
  const nameNorm = normalizeText(ing.matchedProductName);
  const storeNorm = normalizeText(ing.store);
  const price = ing.price ?? 0;

  const exact = deals.find(
    (d) =>
      normalizeText(d.productName) === nameNorm &&
      normalizeText(d.store) === storeNorm &&
      Math.abs(d.price - price) < 0.05
  );
  if (exact) {
    return exact;
  }

  return deals.find(
    (d) =>
      normalizeText(d.store) === storeNorm &&
      (normalizeText(d.productName) === nameNorm ||
        normalizeText(d.productName).includes(nameNorm) ||
        nameNorm.includes(normalizeText(d.productName)))
  );
}

function enrichMealsWithDealDiscounts(
  meals: MealSuggestion[],
  deals: Deal[]
): MealSuggestion[] {
  return meals.map((meal) => ({
    ...meal,
    matchedIngredients: meal.matchedIngredients.map((ing) => {
      if ((ing.discountPercent ?? 0) > 0) {
        return ing;
      }
      const deal = findDealForIngredient(ing, deals);
      if (deal && (deal.discountPercent ?? 0) > 0) {
        return { ...ing, discountPercent: deal.discountPercent };
      }
      if (deal && !ing.priceIsEstimated) {
        return { ...ing, discountPercent: deal.discountPercent };
      }
      return ing;
    }),
  }));
}

function mealHasDiscountedIngredient(meal: MealSuggestion): boolean {
  return meal.matchedIngredients.some(
    (ing) => (ing.discountPercent ?? 0) > 0 && !ing.priceIsEstimated
  );
}

function recipeIsVegan(recipe: Recipe): boolean {
  return recipe.tags.includes("vegan");
}

function recipeIsVegetarianOrVegan(recipe: Recipe): boolean {
  return recipe.tags.includes("vegetarian") || recipe.tags.includes("vegan");
}

function dedupeMealsByRecipeKeepCheapest(meals: MealSuggestion[]): MealSuggestion[] {
  const byId = new Map<string, MealSuggestion>();
  for (const m of meals) {
    const prev = byId.get(m.recipeId);
    if (!prev || m.estimatedTotalCost < prev.estimatedTotalCost) {
      byId.set(m.recipeId, m);
    }
  }
  return [...byId.values()];
}

function selectDiverseBudgetMeals(
  candidates: MealSuggestion[],
  recipes: Recipe[]
): MealSuggestion[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const sorted = [...candidates]
    .filter((m) => recipeMap.has(m.recipeId))
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);

  const used = new Set<string>();
  const out: MealSuggestion[] = [];

  const vegCount = () =>
    out.filter((m) => recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!)).length;

  const veganPick = sorted.find(
    (m) => !used.has(m.recipeId) && recipeIsVegan(recipeMap.get(m.recipeId)!)
  );
  if (veganPick) {
    out.push(veganPick);
    used.add(veganPick.recipeId);
  }

  while (vegCount() < 3 && out.length < MEAL_TARGET_MAX) {
    let added = false;
    for (const m of sorted) {
      if (used.has(m.recipeId)) {
        continue;
      }
      if (recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!)) {
        out.push(m);
        used.add(m.recipeId);
        added = true;
        break;
      }
    }
    if (!added) {
      break;
    }
  }

  for (const m of sorted) {
    if (out.length >= MEAL_TARGET_MAX) {
      break;
    }
    if (used.has(m.recipeId)) {
      continue;
    }
    out.push(m);
    used.add(m.recipeId);
  }

  out.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
  return out;
}

function ensureMinMealCount(
  selected: MealSuggestion[],
  pool: MealSuggestion[],
  min: number
): MealSuggestion[] {
  if (selected.length >= min) {
    return selected;
  }
  const used = new Set(selected.map((m) => m.recipeId));
  const sorted = [...pool].sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
  const out = [...selected];
  for (const m of sorted) {
    if (out.length >= min) {
      break;
    }
    if (used.has(m.recipeId)) {
      continue;
    }
    out.push(m);
    used.add(m.recipeId);
  }
  out.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
  return out;
}

function repairDiversity(
  selected: MealSuggestion[],
  pool: MealSuggestion[],
  recipes: Recipe[]
): MealSuggestion[] {
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));
  const sorted = [...pool].sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
  let out = [...selected];

  const hasVegan = () => out.some((m) => recipeIsVegan(recipeMap.get(m.recipeId)!));
  if (!hasVegan()) {
    const v = sorted.find((m) => recipeIsVegan(recipeMap.get(m.recipeId)!));
    if (v && !out.some((m) => m.recipeId === v.recipeId)) {
      if (out.length >= MEAL_TARGET_MAX) {
        const dropIdx = out.findIndex(
          (m) => !recipeIsVegan(recipeMap.get(m.recipeId)!)
        );
        if (dropIdx !== -1) {
          out.splice(dropIdx, 1);
        }
      }
      out.push(v);
    }
  }

  const vegCount = () =>
    out.filter((m) => recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!)).length;
  while (vegCount() < 3 && out.length < MEAL_TARGET_MAX) {
    const add = sorted.find(
      (m) =>
        recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!) &&
        !out.some((x) => x.recipeId === m.recipeId)
    );
    if (!add) {
      break;
    }
    if (out.length >= MEAL_TARGET_MAX) {
      const dropIdx = out.findIndex(
        (m) => !recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!)
      );
      if (dropIdx === -1) {
        break;
      }
      out.splice(dropIdx, 1);
    }
    out.push(add);
  }

  out.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
  return out.slice(0, MEAL_TARGET_MAX);
}

function buildFinalMealList(
  recipes: Recipe[],
  deals: Deal[]
): MealSuggestion[] {
  const fallbackRaw = fallbackMatcherAll(recipes, deals);
  const fallbackProcessed = postProcessMealSuggestions(fallbackRaw);
  const fallbackEnriched = enrichMealsWithDealDiscounts(fallbackProcessed, deals);

  const merged = dedupeMealsByRecipeKeepCheapest(fallbackEnriched);
  const withDiscount = merged.filter(mealHasDiscountedIngredient);

  let selected = selectDiverseBudgetMeals(withDiscount, recipes);
  selected = ensureMinMealCount(selected, withDiscount, MEAL_TARGET_MIN);
  selected = repairDiversity(selected, withDiscount, recipes);

  return selected
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost)
    .slice(0, MEAL_TARGET_MAX);
}

function fallbackMatcherAll(recipes: Recipe[], deals: Deal[]) {
  const suggestions: MealSuggestion[] = recipes.map((recipe) => {
    const preferred = parsePreferredStores(recipe.primaryStoreSource);

    const matchedIngredients: MatchedIngredient[] = recipe.ingredients.map(
      (ingredient) => {
        const deal = fallbackMatchIngredient(ingredient.name, deals, preferred);
        if (!deal) {
          return {
            ingredientName: ingredient.name,
            amount: ingredient.amount,
            confidence: "low" as const,
            price: ESTIMATED_FALLBACK_EUR,
            priceIsEstimated: true,
            note: "Estimated (no matching deal found).",
          };
        }

        return {
          ingredientName: ingredient.name,
          amount: ingredient.amount,
          matchedProductName: deal.productName,
          store: deal.store,
          price: deal.price,
          discountPercent: deal.discountPercent,
          confidence: "medium" as const,
        };
      }
    );

    const total = matchedIngredients.reduce(
      (sum, item) => sum + (item.price ?? 0),
      0
    );

    const includesEstimated = matchedIngredients.some(
      (item) => item.priceIsEstimated
    );

    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      serves: recipe.serves,
      prepMinutes: recipe.prepMinutes,
      estimatedTotalCost: Number(total.toFixed(2)),
      estimatedCostPerServing: Number((total / recipe.serves).toFixed(2)),
      matchedIngredients,
      includesEstimatedPrices: includesEstimated,
      nutritionalBenefit: recipe.nutritionalBenefit,
      stores: [
        ...new Set(
          matchedIngredients
            .map((item) => item.store)
            .filter((value): value is string => Boolean(value))
        ),
      ],
      reason: includesEstimated
        ? "Matched from current offers (name similarity). Some prices estimated where no offer matched."
        : "Matched from current offers (deterministic).",
    };
  });

  return suggestions
    .filter((recipe) => recipe.estimatedTotalCost > 0)
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
}

/** Budget meals: deterministic matching only (CSV catalog + Marktguru deals). */
export async function matchRecipesWithDeals(recipes: Recipe[], deals: Deal[]) {
  if (recipes.length === 0 || deals.length === 0) {
    return [] as MealSuggestion[];
  }
  return buildFinalMealList(recipes, deals);
}
