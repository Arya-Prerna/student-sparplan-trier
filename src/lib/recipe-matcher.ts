import { normalizeText } from "@/lib/normalize";
import {
  pickRuleForIngredient,
  scoreDealForIngredient,
} from "@/lib/ingredient-match-rules";
import type { Deal, MatchedIngredient, MealSuggestion, Recipe } from "@/lib/types";

const MEAL_TARGET_MIN = 8;
const MEAL_TARGET_MAX = 8;

/** Placeholder EUR per ingredient when no current deal matches (keeps totals honest). */
const ESTIMATED_FALLBACK_EUR = 1.5;

const EN_TO_DE: Record<string, string[]> = {
  potatoes: ["kartoffeln", "kartoffel"],
  potato: ["kartoffel", "kartoffeln"],
  "sweet potato": ["susskartoffel", "suesskartoffel"],
  carrots: ["karotten", "karotte", "mohren"],
  carrot: ["karotte", "karotten", "mohren"],
  apples: ["apfel", "aepfel"],
  apple: ["apfel"],
  "apple juice": ["apfelsaft"],
  applesauce: ["apfelmus"],
  onions: ["zwiebeln", "zwiebel"],
  onion: ["zwiebel", "zwiebeln"],
  "red onions": ["zwiebeln"],
  cabbage: ["kohl", "kraut", "weisskohl", "rotkohl"],
  "red cabbage": ["rotkohl", "blaukraut"],
  sauerkraut: ["sauerkraut"],
  rice: ["reis"],
  lentils: ["linsen"],
  "brown lentils": ["linsen"],
  "red lentils": ["linsen", "rote linsen"],
  chickpeas: ["kichererbsen"],
  peas: ["erbsen"],
  "split peas": ["erbsen", "schaleerbsen"],
  spinach: ["spinat", "blattspinat"],
  kale: ["gruenkohl"],
  eggs: ["eier"],
  milk: ["milch"],
  flour: ["mehl"],
  cream: ["sahne", "schlagsahne"],
  butter: ["butter"],
  cheese: ["kase", "kaese"],
  yogurt: ["joghurt", "jogurt"],
  "cannellini beans": ["weisse bohnen"],
  "kidney beans": ["kidneybohnen"],
  tomatoes: ["tomaten"],
  "passierte tomaten": ["passierte tomaten"],
  cucumbers: ["gurken", "gurke"],
  leeks: ["lauch", "porree"],
  mushrooms: ["pilze", "champignons"],
  broccoli: ["brokkoli", "broccoli"],
  cauliflower: ["blumenkohl"],
  "brussels sprouts": ["rosenkohl"],
  pumpkin: ["kurbis", "kuerbis", "hokkaido"],
  "hokkaido pumpkin": ["hokkaido", "kurbis"],
  asparagus: ["spargel"],
  "white asparagus": ["spargel", "weisser spargel"],
  beets: ["rote bete", "rote beete"],
  kohlrabi: ["kohlrabi"],
  parsnips: ["pastinaken"],
  walnuts: ["walnuesse", "walnuss"],
  chestnuts: ["kastanien", "maronen"],
  bacon: ["speck", "bacon"],
  "chicken breast": ["haehnchenbrust", "huehnerbrust", "haehnchen"],
  chicken: ["haehnchen", "huhn", "huehnchen"],
  "minced meat": ["hackfleisch", "mett"],
  ham: ["schinken"],
  "smoked ham": ["rauchschinken", "schinken"],
  "smoked pork": ["kasseler", "kassler"],
  sausage: ["wurst", "wuerstchen"],
  "smoked trout": ["forelle", "raeucherforelle"],
  trout: ["forelle"],
  bread: ["brot"],
  "rye bread": ["roggenbrot", "vollkornbrot"],
  pasta: ["nudeln", "pasta", "spaghetti"],
  noodles: ["nudeln"],
  "potato noodles": ["schupfnudeln"],
  gnocchi: ["gnocchi"],
  quark: ["quark"],
  brie: ["brie"],
  feta: ["feta"],
  camembert: ["camembert"],
  peppers: ["paprika"],
  paprika: ["paprika"],
  corn: ["mais"],
  dill: ["dill"],
  garlic: ["knoblauch"],
  vinegar: ["essig"],
  balsamic: ["balsamico"],
  ketchup: ["ketchup"],
  mustard: ["senf"],
  pickles: ["gurken", "gewuerzgurken"],
  "tofu": ["tofu"],
  "smoked tofu": ["raeuchertofu", "tofu"],
  tvp: ["sojagranulat", "soja"],
  "vegan mince": ["veganes hack", "soja hack", "sojagranulat"],
  "seitan sausage": ["seitan", "vegane wurst"],
  tortilla: ["tortilla", "wraps"],
  avocado: ["avocado"],
  strawberries: ["erdbeeren"],
  "frozen florets": ["blumenkohl", "brokkoli", "tiefkuehl gemuese"],
  broth: ["bruehe", "bruhe", "bouillon"],
  greens: ["salat", "blattsalat"],
  chives: ["schnittlauch"],
  rosemary: ["rosmarin"],
  yeast: ["hefe"],
  nutmeg: ["muskat"],
  "pearl barley": ["graupen", "gerste"],
  oats: ["haferflocken"],
};

function translateIngredient(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const direct = EN_TO_DE[lower];
  if (direct) {
    return direct;
  }
  for (const [en, de] of Object.entries(EN_TO_DE)) {
    if (lower.includes(en) || en.includes(lower)) {
      return de;
    }
  }
  return [];
}

function normalizeIngredientName(name: string): string {
  return normalizeText(name).replace(/\s+/g, " ");
}

function buildIngredientTokens(name: string): string[] {
  const normalized = normalizeIngredientName(name);
  const tokens = normalized.split(" ").filter((token) => token.length >= 2);
  const deTokens = translateIngredient(name);
  for (const dt of deTokens) {
    const parts = normalizeText(dt)
      .split(" ")
      .filter((t) => t.length >= 2);
    for (const p of parts) {
      if (!tokens.includes(p)) {
        tokens.push(p);
      }
    }
  }
  return tokens;
}

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

function dealEffectiveDiscountPercent(deal: Deal): number {
  const reported = deal.discountPercent ?? 0;
  if (reported > 0) {
    return reported;
  }
  const oldP = deal.oldPrice;
  if (oldP && oldP > deal.price && oldP > 0) {
    return Number((((oldP - deal.price) / oldP) * 100).toFixed(1));
  }
  return 0;
}

function referenceListPriceFromDeal(deal: Deal): number | undefined {
  if (deal.oldPrice && deal.oldPrice > deal.price) {
    return deal.oldPrice;
  }
  const pct = deal.discountPercent ?? 0;
  if (pct > 0 && deal.price > 0) {
    return Number((deal.price / (1 - pct / 100)).toFixed(2));
  }
  return undefined;
}

function fallbackMatchIngredient(
  ingredient: string,
  deals: Deal[],
  preferredRetailers: string[]
): Deal | undefined {
  const ingNorm = normalizeIngredientName(ingredient);
  const rule = pickRuleForIngredient(ingNorm);
  let tokens = buildIngredientTokens(ingredient);
  if (tokens.length === 0 && ingNorm.length >= 2) {
    tokens = [ingNorm];
  }

  const scored = deals
    .map((deal) => ({
      deal,
      score: scoreDealForIngredient(deal, tokens, ingNorm, rule),
    }))
    .filter(
      (x) =>
        Number.isFinite(x.score) &&
        x.score > Number.NEGATIVE_INFINITY &&
        x.score > 0
    );

  if (scored.length > 0) {
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.deal.price - b.deal.price;
    });
    const topScore = scored[0]!.score;
    const top = scored.filter((s) => s.score === topScore);
    const preferred = top.filter((t) =>
      dealMatchesPreferredRetailers(t.deal, preferredRetailers)
    );
    const pool = preferred.length > 0 ? preferred : top;
    return [...pool].sort((a, b) => a.deal.price - b.deal.price)[0]!.deal;
  }

  if (rule != null) {
    return undefined;
  }

  const legacyMatches = deals.filter((deal) =>
    tokens.some((token) => deal.normalizedProductName.includes(token))
  );
  if (legacyMatches.length === 0) {
    return undefined;
  }
  const preferredLegacy = legacyMatches.filter((m) =>
    dealMatchesPreferredRetailers(m, preferredRetailers)
  );
  const pool = preferredLegacy.length > 0 ? preferredLegacy : legacyMatches;
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
          note: ing.note ?? "Estimated (no matching deal found this week).",
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
      d.normalizedProductName === nameNorm &&
      normalizeText(d.store) === storeNorm &&
      Math.abs(d.price - price) < 0.05
  );
  if (exact) {
    return exact;
  }

  return deals.find(
    (d) =>
      normalizeText(d.store) === storeNorm &&
      (d.normalizedProductName === nameNorm ||
        d.normalizedProductName.includes(nameNorm) ||
        nameNorm.includes(d.normalizedProductName))
  );
}

function enrichMealsWithDealDiscounts(
  meals: MealSuggestion[],
  deals: Deal[]
): MealSuggestion[] {
  return meals.map((meal) => ({
    ...meal,
    matchedIngredients: meal.matchedIngredients.map((ing) => {
      const deal = findDealForIngredient(ing, deals);
      if (!deal) {
        return ing;
      }
      const effective = dealEffectiveDiscountPercent(deal);
      const ref = referenceListPriceFromDeal(deal);
      if (effective > 0) {
        return {
          ...ing,
          discountPercent: effective,
          referenceListPrice: ref ?? ing.referenceListPrice,
        };
      }
      if (!ing.priceIsEstimated) {
        return {
          ...ing,
          discountPercent: deal.discountPercent ?? ing.discountPercent,
          referenceListPrice: ref ?? ing.referenceListPrice,
        };
      }
      return ing;
    }),
  }));
}

function attachBundleSavings(meals: MealSuggestion[]): MealSuggestion[] {
  return meals.map((meal) => {
    let listSum = 0;
    let hasList = false;
    for (const ing of meal.matchedIngredients) {
      const ref = ing.referenceListPrice;
      if (typeof ref === "number" && ref > 0 && !ing.priceIsEstimated) {
        listSum += ref;
        hasList = true;
      } else if (typeof ing.price === "number" && ing.price > 0) {
        listSum += ing.price;
      }
    }
    if (!hasList || listSum <= 0 || meal.estimatedTotalCost <= 0) {
      return meal;
    }
    const pct = Math.max(
      0,
      Math.min(99, Number(((1 - meal.estimatedTotalCost / listSum) * 100).toFixed(1)))
    );
    return {
      ...meal,
      estimatedListPriceTotal: Number(listSum.toFixed(2)),
      bundleSavingsPercent: pct > 0.5 ? pct : undefined,
    };
  });
}

/**
 * A meal qualifies if at least one ingredient is matched to a real store offer
 * (not a placeholder estimate). Having an explicit discountPercent is a bonus
 * but not required — Marktguru flyer items are promotional by nature.
 */
function mealHasRealDealIngredient(meal: MealSuggestion): boolean {
  return meal.matchedIngredients.some(
    (ing) => !ing.priceIsEstimated && !!ing.matchedProductName
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

  while (vegCount() < 3) {
    let added = false;
    for (const m of sorted) {
      if (used.has(m.recipeId)) {
        continue;
      }
      if (recipeIsVegetarianOrVegan(recipeMap.get(m.recipeId)!)) {
        if (out.length >= MEAL_TARGET_MAX) {
          const dropIdx = out.findIndex(
            (x) => !recipeIsVegetarianOrVegan(recipeMap.get(x.recipeId)!)
          );
          if (dropIdx === -1) {
            break;
          }
          const dropped = out[dropIdx]!;
          used.delete(dropped.recipeId);
          out.splice(dropIdx, 1);
        }
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
  const out = [...selected];

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
  while (vegCount() < 3) {
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

function buildFinalMealList(recipes: Recipe[], deals: Deal[]): MealSuggestion[] {
  const fallbackRaw = fallbackMatcherAll(recipes, deals);
  const fallbackProcessed = postProcessMealSuggestions(fallbackRaw);
  const fallbackEnriched = enrichMealsWithDealDiscounts(fallbackProcessed, deals);

  const merged = dedupeMealsByRecipeKeepCheapest(fallbackEnriched);
  const withDiscount = merged.filter(mealHasRealDealIngredient);

  let selected = selectDiverseBudgetMeals(withDiscount, recipes);
  selected = ensureMinMealCount(selected, withDiscount, MEAL_TARGET_MIN);
  selected = repairDiversity(selected, withDiscount, recipes);

  selected = selected.map((m) => ({ ...m, chosenViaPromoFilter: true as const }));

  if (selected.length < MEAL_TARGET_MAX) {
    const usedIds = new Set(selected.map((m) => m.recipeId));
    const fillerPool = [...merged]
      .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost)
      .filter((m) => !usedIds.has(m.recipeId));
    for (const m of fillerPool) {
      if (selected.length >= MEAL_TARGET_MAX) {
        break;
      }
      usedIds.add(m.recipeId);
      selected.push({ ...m, chosenViaPromoFilter: false });
    }
  }

  selected = attachBundleSavings(
    selected.sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost).slice(0, MEAL_TARGET_MAX)
  );
  return selected;
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

        const effectiveDisc = dealEffectiveDiscountPercent(deal);
        const refPrice = referenceListPriceFromDeal(deal);

        return {
          ingredientName: ingredient.name,
          amount: ingredient.amount,
          matchedProductName: deal.productName,
          store: deal.store,
          price: deal.price,
          discountPercent: effectiveDisc > 0 ? effectiveDisc : deal.discountPercent,
          referenceListPrice: refPrice,
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
        ? "Matched from current offers (token + rules). Some prices estimated where no offer matched."
        : "Matched from current offers (token + rules).",
    };
  });

  return suggestions
    .filter((recipe) => recipe.estimatedTotalCost > 0)
    .sort((a, b) => a.estimatedTotalCost - b.estimatedTotalCost);
}

/** Budget meals: deterministic matching (CSV catalog + Marktguru deals). */
export function matchRecipesWithDeals(recipes: Recipe[], deals: Deal[]): MealSuggestion[] {
  if (recipes.length === 0 || deals.length === 0) {
    return [];
  }
  return buildFinalMealList(recipes, deals);
}
