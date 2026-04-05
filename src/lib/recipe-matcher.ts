import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { normalizeText } from "@/lib/normalize";
import type { Deal, MatchedIngredient, MealSuggestion, Recipe } from "@/lib/types";

/** Default: Haiku 4.5 for fuzzy ingredient ↔ offer matching (override via ANTHROPIC_MODEL). */
const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

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

function fallbackMatcher(recipes: Recipe[], deals: Deal[]) {
  const suggestions: MealSuggestion[] = recipes
    .map((recipe) => {
      const matchedIngredients: MatchedIngredient[] = recipe.ingredients.map(
        (ingredient) => {
          const deal = fallbackMatchIngredient(ingredient.name, deals);
          if (!deal) {
            return {
              ingredientName: ingredient.name,
              amount: ingredient.amount,
              confidence: "low",
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
            confidence: "medium",
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
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost)
    .slice(0, 7);

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
    ingredients: recipe.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amount: ingredient.amount,
      category: ingredient.category,
    })),
  }));
}

export async function matchRecipesWithDeals(recipes: Recipe[], deals: Deal[]) {
  if (recipes.length === 0 || deals.length === 0) {
    return [] as MealSuggestion[];
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return postProcessMealSuggestions(fallbackMatcher(recipes, deals));
  }

  const anthropic = new Anthropic({ apiKey });
  const compactDeals = serializeDealsForPrompt(deals.slice(0, 120));
  const compactRecipes = serializeRecipesForPrompt(recipes);

  const systemPrompt = `
You are a grocery price-matching assistant for students in Germany (Marktguru offers).
You MUST NOT invent recipes. Recipes are fixed by input.
Your task:
1) Match each recipe ingredient to the best available grocery offer from the deals list.
2) Prefer lower total price while keeping matching quality reasonable.
3) Return ONLY valid JSON array with this exact schema:
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
        "confidence": "high|medium|low",
        "note": "string optional"
      }
    ]
  }
]
Rules:
- Output max 7 recipes sorted by estimatedTotalCost ascending.
- Use Euro numeric values only (no currency symbols).
- If an ingredient cannot be matched to any deal, set price to 0 and confidence "low" (the app will apply a default estimate).
- Product names may be German; store names are retailer chains from the data.
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
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 3200,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const output = message.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");

    const parsedText = extractJson(output);
    const parsed = JSON.parse(parsedText);
    return postProcessMealSuggestions(mealSuggestionsSchema.parse(parsed));
  } catch {
    return postProcessMealSuggestions(fallbackMatcher(recipes, deals));
  }
}

