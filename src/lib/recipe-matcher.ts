import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { normalizeText } from "@/lib/normalize";
import type { Deal, MatchedIngredient, MealSuggestion, Recipe } from "@/lib/types";

/** Plan default: Haiku for fuzzy ingredient ↔ offer matching (override via ANTHROPIC_MODEL). */
const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";

const mealSuggestionSchema = z.object({
  recipeId: z.string(),
  recipeName: z.string(),
  serves: z.number(),
  prepMinutes: z.number(),
  estimatedTotalCost: z.number(),
  estimatedCostPerServing: z.number(),
  stores: z.array(z.string()),
  reason: z.string(),
  matchedIngredients: z.array(
    z.object({
      ingredientName: z.string(),
      amount: z.string(),
      matchedProductName: z.string().optional(),
      store: z.string().optional(),
      price: z.number().optional(),
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
              note: "Kein passendes Angebot gefunden.",
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

      return {
        recipeId: recipe.id,
        recipeName: recipe.name,
        serves: recipe.serves,
        prepMinutes: recipe.prepMinutes,
        estimatedTotalCost: Number(total.toFixed(2)),
        estimatedCostPerServing: Number((total / recipe.serves).toFixed(2)),
        matchedIngredients,
        stores: [
          ...new Set(
            matchedIngredients
              .map((item) => item.store)
              .filter((value): value is string => Boolean(value))
          ),
        ],
        reason:
          total > 0
            ? "Fallback-Matching ohne AI: basiert auf Namensahnlichkeit."
            : "Zu wenige passende Angebote fur diese Woche.",
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
    return fallbackMatcher(recipes, deals);
  }

  const anthropic = new Anthropic({ apiKey });
  const compactDeals = serializeDealsForPrompt(deals.slice(0, 120));
  const compactRecipes = serializeRecipesForPrompt(recipes);

  const systemPrompt = `
You are a grocery price-matching assistant for students in Trier.
You MUST NOT invent recipes. Recipes are fixed by input.
Your task:
1) Match each recipe ingredient to the best available grocery offer.
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
- If ingredient cannot be matched, include it with confidence "low" and a note.
- Use German context and grocery naming where possible.
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
    return mealSuggestionsSchema.parse(parsed);
  } catch {
    return fallbackMatcher(recipes, deals);
  }
}

