import { promises as fs } from "node:fs";
import path from "node:path";

import type { Recipe } from "@/lib/types";

function categoryToTags(category: string): string[] {
  const c = category.trim().toLowerCase();
  if (c === "vegan") {
    return ["vegan"];
  }
  if (c === "vegetarian") {
    return ["vegetarian"];
  }
  if (c.includes("non-veg") || c === "non-veg") {
    return ["meat"];
  }
  return [];
}

function staplesToIngredients(staples: string) {
  return staples
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      amount: "as needed",
      category: "staple",
    }));
}

/**
 * Curated budget meal catalog (CSV). Default serves/prep for rows without those columns.
 */
export async function loadBudgetRecipes(): Promise<Recipe[]> {
  const filePath = path.join(process.cwd(), "data", "budget-recipes.csv");
  const content = await fs.readFile(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const recipes: Recipe[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.startsWith("ID,")) {
      continue;
    }
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 6) {
      continue;
    }
    const [idRaw, name, category, primaryStoreSource, mainStaples, nutritionalBenefit] = parts;
    const id = idRaw.trim().toLowerCase();
    recipes.push({
      id,
      name,
      serves: 2,
      prepMinutes: 25,
      ingredients: staplesToIngredients(mainStaples),
      tags: categoryToTags(category),
      primaryStoreSource: primaryStoreSource || undefined,
      nutritionalBenefit: nutritionalBenefit || undefined,
    });
  }

  return recipes;
}
