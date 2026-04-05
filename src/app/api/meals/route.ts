import { promises as fs } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { matchRecipesWithDeals } from "@/lib/recipe-matcher";
import type { Recipe } from "@/lib/types";

async function loadRecipes() {
  const filePath = path.join(process.cwd(), "data", "recipes.json");
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as Recipe[];
}

export async function GET() {
  try {
    const [recipes, deals] = await Promise.all([
      loadRecipes(),
      fetchTopDealsForMealMatching(),
    ]);

    const suggestions = await matchRecipesWithDeals(recipes, deals);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      sourceDealsCount: deals.length,
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

