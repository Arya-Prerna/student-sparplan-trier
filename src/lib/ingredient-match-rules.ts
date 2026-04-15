import type { Deal } from "@/lib/types";

/** Whole words from a normalized product title (no substring false positives). */
export function productWordTokens(normalizedProductName: string): Set<string> {
  return new Set(
    normalizedProductName
      .split(/[^a-z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
  );
}

export interface IngredientMatchRule {
  /** Return true when this rule should govern the ingredient line. */
  appliesTo: (ingredientNormalized: string) => boolean;
  /** Bonus whole-words in the product (rice types, etc.). */
  positiveWords: string[];
  /** Reject if any of these appears as a whole token in the product. */
  forbiddenWords: string[];
  /** Reject if the full normalized product string includes any of these. */
  forbiddenSubstrings: string[];
}

const RICE_RULE: IngredientMatchRule = {
  appliesTo: (n) => (n.includes("reis") || n.includes("rice")) && !n.includes("kicher"),
  positiveWords: ["reis", "jasmin", "basmati", "langkorn", "spitzen", "parboiled", "duft"],
  forbiddenWords: [],
  forbiddenSubstrings: [
    "milchreis",
    "milch reis",
    "reispudding",
    "sushireis",
    "dessertreis",
  ],
};

const PEAS_RULE: IngredientMatchRule = {
  appliesTo: (n) =>
    (n.includes("erbsen") || n.includes("erbse") || n.includes("peas")) && !n.includes("kicher") && !n.includes("chickpea"),
  positiveWords: ["erbsen", "erbse", "gruene", "garten", "peas"],
  forbiddenWords: ["joghurt", "jogurt", "quark", "pudding"],
  forbiddenSubstrings: [
    "kichererbsen",
    "kichererbse",
    "kichererb",
    "joghurt",
    "jogurt",
    "quark",
    "fruchtzwerg",
    "fruchtzwerge",
  ],
};

const CARROT_RULE: IngredientMatchRule = {
  appliesTo: (n) => n.includes("karott") || n.includes("mohre") || n.includes("mohren") || n.includes("carrot"),
  positiveWords: ["karotten", "karotte", "mohre", "mohren", "babykarotten", "carrots", "carrot"],
  forbiddenWords: ["joghurt", "jogurt", "quark", "pudding"],
  forbiddenSubstrings: [
    "karottensaft",
    "karotten saft",
    "smoothie",
    "saftkarotte",
    "joghurt",
    "jogurt",
    "quark",
    "fruchtzwerg",
    "fruchtzwerge",
  ],
};

const EGG_RULE: IngredientMatchRule = {
  appliesTo: (n) => n.includes("eier") || n === "ei" || n.endsWith(" ei") || n.includes("eggs") || n === "egg",
  positiveWords: ["eier", "ei", "brutei", "bioeier", "frischei", "wachtelei", "eggs"],
  forbiddenWords: [
    "joghurt",
    "quark",
    "frischkase",
    "frischkäse",
    "sahne",
    "pudding",
    "dessert",
    "bruehe",
    "bruhe",
    "suppe",
    "bouillon",
  ],
  forbiddenSubstrings: ["eierlikor", "eierlikör", "mayonnaise", "mayo", "huehner", "huhner"],
};

const CHICKPEA_RULE: IngredientMatchRule = {
  appliesTo: (n) => n.includes("kicher") || n.includes("chickpea") || n.includes("chickpeas"),
  positiveWords: ["kichererbsen", "kichererbse", "chickpea", "chickpeas"],
  forbiddenWords: [],
  forbiddenSubstrings: [],
};

const SPINACH_RULE: IngredientMatchRule = {
  appliesTo: (n) => n.includes("spinat") || n.includes("spinach"),
  positiveWords: ["spinat", "blattspinat", "babyspinat", "spinach"],
  forbiddenWords: [],
  forbiddenSubstrings: ["spinatsaft", "smoothie", "drink"],
};

const RULES: IngredientMatchRule[] = [
  RICE_RULE,
  PEAS_RULE,
  CARROT_RULE,
  EGG_RULE,
  CHICKPEA_RULE,
  SPINACH_RULE,
];

export function pickRuleForIngredient(ingredientNormalized: string): IngredientMatchRule | null {
  for (const rule of RULES) {
    if (rule.appliesTo(ingredientNormalized)) {
      return rule;
    }
  }
  return null;
}

function violatesRule(rule: IngredientMatchRule, fullNorm: string, words: Set<string>): boolean {
  for (const sub of rule.forbiddenSubstrings) {
    if (fullNorm.includes(sub)) {
      return true;
    }
  }
  for (const w of rule.forbiddenWords) {
    if (words.has(w)) {
      return true;
    }
  }
  return false;
}

/**
 * Score a deal for an ingredient. Higher is better. -Infinity = reject.
 * Prefers whole-word hits over substring-only hits.
 */
export function scoreDealForIngredient(
  deal: Deal,
  ingredientTokens: string[],
  ingredientNormalized: string,
  rule: IngredientMatchRule | null
): number {
  const full = deal.normalizedProductName;
  const words = productWordTokens(full);
  let score = 0;

  if (rule && violatesRule(rule, full, words)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (rule) {
    for (const pw of rule.positiveWords) {
      if (words.has(pw)) {
        score = Math.max(score, 80 + Math.min(pw.length, 12));
      }
    }
  }

  for (const t of ingredientTokens) {
    if (words.has(t)) {
      score = Math.max(score, 60 + Math.min(t.length, 12));
    }
  }

  if (score === 0 && !rule) {
    for (const t of ingredientTokens) {
      if (full.includes(t)) {
        score = Math.max(score, 15);
      }
    }
  }

  return score;
}
