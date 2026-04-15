import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

import { loadBudgetRecipes } from "@/lib/budget-recipes";
import { getCachedDealPoolForZip } from "@/lib/cached-deals";
import { matchRecipesWithDeals } from "@/lib/recipe-matcher";

async function buildMealSuggestions(zipCode: string) {
  const [recipes, deals] = await Promise.all([
    loadBudgetRecipes(),
    getCachedDealPoolForZip(zipCode),
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

