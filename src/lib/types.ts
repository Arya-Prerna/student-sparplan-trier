export type DataSource = "marktguru" | "overpass" | "manual" | "haiku";

export interface Deal {
  id: string;
  productName: string;
  normalizedProductName: string;
  store: string;
  price: number;
  oldPrice?: number;
  discountPercent?: number;
  imageUrl?: string;
  validFrom?: string;
  validUntil?: string;
  category?: string;
  unit?: string;
  source: DataSource;
  raw?: unknown;
}

export interface SearchDealsOptions {
  zipCode?: string;
  limit?: number;
  offset?: number;
  cacheSeconds?: number;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  category: string;
}

export interface Recipe {
  id: string;
  name: string;
  serves: number;
  prepMinutes: number;
  ingredients: RecipeIngredient[];
  tags: string[];
  /** Hint for matching offers, e.g. "Aldi/Lidl". */
  primaryStoreSource?: string;
  nutritionalBenefit?: string;
}

export interface MatchedIngredient {
  ingredientName: string;
  amount: string;
  matchedProductName?: string;
  store?: string;
  price?: number;
  discountPercent?: number;
  referenceListPrice?: number;
  priceIsEstimated?: boolean;
  confidence: "high" | "medium" | "low";
  note?: string;
}

export interface MealSuggestion {
  recipeId: string;
  recipeName: string;
  serves: number;
  prepMinutes: number;
  estimatedTotalCost: number;
  estimatedCostPerServing: number;
  matchedIngredients: MatchedIngredient[];
  stores: string[];
  reason: string;
  includesEstimatedPrices?: boolean;
  estimatedListPriceTotal?: number;
  bundleSavingsPercent?: number;
  chosenViaPromoFilter?: boolean;
  nutritionalBenefit?: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  brand?: string;
  address?: string;
  postcode?: string;
  openingHours?: string;
  lat?: number;
  lon?: number;
  notes?: string;
  source: DataSource;
}

export interface StoreMeta {
  slug: string;
  name: string;
  notes: string;
  budgetRating: 1 | 2 | 3 | 4 | 5;
}

export interface StudentPick {
  productName: string;
  store: string;
  price: number;
  imageUrl?: string;
  reason: string;
  discountPercent?: number;
}
