import OpenAI from "openai";
import { z } from "zod";

import { normalizeText } from "@/lib/normalize";
import type { Deal, MatchedIngredient, MealSuggestion, Recipe } from "@/lib/types";

/** Default: Gemma 3 27B via OpenRouter for fuzzy ingredient ↔ offer matching (override via OPENROUTER_MODEL). */
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "google/gemma-3-27b-it:free";

const MEAL_TARGET_MIN = 8;
const MEAL_TARGET_MAX = 10;
const DEALS_FOR_LLM = 50;

const mealSuggestionSchema = z.object({
  recipeId: z.string(),
  recipeName: z.string(),
  serves: z.number(),
  prepMinutes: z.number(),
  estimatedTotalCost: z.number(),
  estimatedCostPerServing: z.number(),
  stores: z.array(z.string()),
  reason: z.string(),
  includesEstimatedPrices: z.boolean().optional(),
  matchedIngredients: z.array(
    z.object({
      ingredientName: z.string(),
      amount: z.string(),
      matchedProductName: z.string().optional(),
      store: z.string().optional(),
      price: z.number().optional(),
      discountPercent: z.number().optional(),
      priceIsEstimated: z.boolean().optional(),
      confidence: z.enum(["high", "medium", "low"]),
      note: z.string().optional(),
    })
  ),
});

const mealSuggestionsSchema = z.array(mealSuggestionSchema);

function extractJson(text: string) {
  const objectStart = text.indexOf("[");
  const objectEnd = text.lastIndexOf("]");
  if (objectStart >= 0 && objectEnd >= objectStart) {
    return text.slice(objectStart, objectEnd + 1);
  }
  throw new Error("Could not find JSON array in model response.");
}

function buildIngredientTokens(name: string) {
  const normalized = normalizeText(name);
  return normalized.split(" ").filter((token) => token.length >= 3);
}

/** Placeholder EUR per ingredient when no current deal matches (keeps totals honest). */
const ESTIMATED_FALLBACK_EUR = 1.5;

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
  aiMeals: MealSuggestion[],
  recipes: Recipe[],
  deals: Deal[]
): MealSuggestion[] {
  const fallbackRaw = fallbackMatcherAll(recipes, deals);
  const fallbackProcessed = postProcessMealSuggestions(fallbackRaw);
  const fallbackEnriched = enrichMealsWithDealDiscounts(fallbackProcessed, deals);

  const aiEnriched = enrichMealsWithDealDiscounts(aiMeals, deals);

  const merged = dedupeMealsByRecipeKeepCheapest([...aiEnriched, ...fallbackEnriched]);
  const withDiscount = merged.filter(mealHasDiscountedIngredient);

  let selected = selectDiverseBudgetMeals(withDiscount, recipes);
  selected = ensureMinMealCount(selected, withDiscount, MEAL_TARGET_MIN);
  selected = repairDiversity(selected, withDiscount, recipes);

  return selected.slice(0, MEAL_TARGET_MAX);
}

function fallbackMatchIngredient(ingredient: string, deals: Deal[]) {
  const tokens = buildIngredientTokens(ingredient);

  const matches = deals.filter((deal) =>
    tokens.some((token) => deal.normalizedProductName.includes(token))
  );

  if (matches.length === 0) {
    return undefined;
  }

  return matches.sort((a, b) => a.price - b.price)[0];
}

/** Deterministic matcher over all recipes; sorted by total cost (for filling gaps). */
function fallbackMatcherAll(recipes: Recipe[], deals: Deal[]) {
  const suggestions: MealSuggestion[] = recipes
    .map((recipe) => {
      const matchedIngredients: MatchedIngredient[] = recipe.ingredients.map(
        (ingredient) => {
          const deal = fallbackMatchIngredient(ingredient.name, deals);
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
        stores: [
          ...new Set(
            matchedIngredients
              .map((item) => item.store)
              .filter((value): value is string => Boolean(value))
          ),
        ],
        reason: includesEstimated
          ? "Fallback matching (no AI): name similarity. Some prices are estimated where no offer matched."
          : "Fallback matching (no AI): based on product name similarity.",
      };
    })
    .filter((recipe) => recipe.estimatedTotalCost > 0)
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);

  return suggestions;
}

function serializeDealsForPrompt(deals: Deal[]) {
  return deals.map((deal) => ({
    productName: deal.productName,
    store: deal.store,
    price: deal.price,
    oldPrice: deal.oldPrice,
    discountPercent: deal.discountPercent,
    category: deal.category,
  }));
}

function serializeRecipesForPrompt(recipes: Recipe[]) {
  return recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    serves: recipe.serves,
    prepMinutes: recipe.prepMinutes,
    tags: recipe.tags,
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      category: ingredient.category,
    })),
  }));
}

function topDealsForModel(deals: Deal[]): Deal[] {
  return [...deals]
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, DEALS_FOR_LLM);
}

export async function matchRecipesWithDeals(recipes: Recipe[], deals: Deal[]) {
  if (recipes.length === 0 || deals.length === 0) {
    return [] as MealSuggestion[];
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return buildFinalMealList([], recipes, deals);
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
  const compactDeals = serializeDealsForPrompt(topDealsForModel(deals));
  const compactRecipes = serializeRecipesForPrompt(recipes);

  const systemPrompt = `
You are a grocery assistant for students in Germany. Match recipe ingredients to offers from the deals list only.
Rules:
- Use only recipe ids from input. Do not invent recipes.
- Return a JSON array only (no markdown).
- Include at least 8 different recipes.
- At least 3 must be vegetarian (recipe tags include "vegetarian" or "vegan"); at least 1 must be vegan (tags include "vegan").
- Each meal must use at least one ingredient matched to a deal with discountPercent > 0 (a real discount).
- Prefer lower estimatedTotalCost. Sort output by estimatedTotalCost ascending.
- If no deal fits an ingredient, set price to 0 and confidence "low" (the app fills a placeholder).
- For each matched offer, set discountPercent from the deals list when applicable.
Schema:
[
  {
    "recipeId": "string",
    "recipeName": "string",
    "serves": number,
    "prepMinutes": number,
    "estimatedTotalCost": number,
    "estimatedCostPerServing": number,
    "stores": ["string"],
    "reason": "string",
    "matchedIngredients": [
      {
        "ingredientName": "string",
        "amount": "string",
        "matchedProductName": "string",
        "store": "string",
        "price": number,
        "discountPercent": number,
        "confidence": "high|medium|low",
        "note": "string optional"
      }
    ]
  }
]
Euro numbers only, no currency symbols.
`.trim();

  const userPrompt = JSON.stringify(
    {
      recipes: compactRecipes,
      deals: compactDeals,
    },
    null,
    2
  );

  try {
    const message = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const output = message.choices[0]?.message?.content ?? "";

    const parsedText = extractJson(output);
    const parsed = JSON.parse(parsedText);
    const parsedMeals = mealSuggestionsSchema.parse(parsed);
    const processed = postProcessMealSuggestions(parsedMeals);
    return buildFinalMealList(processed, recipes, deals);
  } catch (err) {
    console.error("[recipe-matcher] AI call failed, using fallback:", err);
    return buildFinalMealList([], recipes, deals);
  }
}
