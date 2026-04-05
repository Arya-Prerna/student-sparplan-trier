import { promises as fs } from "node:fs";
import path from "node:path";

import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { matchRecipesWithDeals } from "@/lib/recipe-matcher";
import type { Recipe } from "@/lib/types";

async function loadRecipes() {
  const filePath = path.join(process.cwd(), "data", "recipes.json");
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as Recipe[];
}

async function buildMealSuggestions(zipCode: string) {
  const [recipes, deals] = await Promise.all([
    loadRecipes(),
    fetchTopDealsForMealMatching(zipCode),
  ]);

  const suggestions = await matchRecipesWithDeals(recipes, deals);
  return { suggestions, sourceDealsCount: deals.length };
}

export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams.get("zipCode") ?? "54290";

  try {
    const getCachedMealPayload = unstable_cache(
      () => buildMealSuggestions(zipCode),
      ["meal-suggestions", zipCode],
      { revalidate: 21600 }
    );
    const { suggestions, sourceDealsCount } = await getCachedMealPayload();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      zipCode,
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

