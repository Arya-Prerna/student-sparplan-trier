import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { matchRecipesWithDeals } from "@/lib/recipe-matcher";
import type { Recipe } from "@/lib/types";

/** Match plan: cache cheapest-meals computation for 6 hours (21600s). */
export const revalidate = 21600;

async function loadRecipes() {
  const filePath = path.join(process.cwd(), "data", "recipes.json");
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as Recipe[];
}

async function buildMealSuggestions() {
  const [recipes, deals] = await Promise.all([
    loadRecipes(),
    fetchTopDealsForMealMatching(),
  ]);

  const suggestions = await matchRecipesWithDeals(recipes, deals);
  return { suggestions, sourceDealsCount: deals.length };
}

const getCachedMealPayload = unstable_cache(buildMealSuggestions, ["meal-suggestions"], {
  revalidate: 21600,
});

export async function GET() {
  try {
    const { suggestions, sourceDealsCount } = await getCachedMealPayload();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      sourceDealsCount,
      suggestions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to build cheapest meal suggestions.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

