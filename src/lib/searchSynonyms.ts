import { normalizeText } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

/** English (and common variants) → German Marktguru-friendly search terms. */
export const SYNONYMS: Record<string, string[]> = {
  tomato: ["tomaten", "tomate"],
  tomatoes: ["tomaten"],
  milk: ["milch"],
  egg: ["eier"],
  eggs: ["eier"],
  bread: ["brot"],
  pasta: ["nudeln", "pasta"],
  rice: ["reis"],
  potato: ["kartoffeln", "kartoffel"],
  potatoes: ["kartoffeln"],
  cheese: ["kaese", "käse", "kase"],
  chicken: ["huhn", "hahnchen", "hähnchen"],
  beef: ["rind", "hackfleisch"],
  pork: ["schwein", "schweinefleisch"],
  yogurt: ["joghurt"],
  yoghurt: ["joghurt"],
  butter: ["butter"],
  flour: ["mehl"],
  apple: ["apfel", "äpfel"],
  apples: ["apfel"],
  banana: ["banane", "bananen"],
  onion: ["zwiebel", "zwiebeln"],
  onions: ["zwiebeln"],
  carrot: ["mohre", "möhre", "karotte"],
  carrots: ["mohren", "karotten"],
  cucumber: ["gurke"],
  salad: ["salat"],
  orange: ["orange", "orangen"],
  lemon: ["zitrone"],
  spinach: ["spinat"],
  broccoli: ["brokkoli"],
  pepper: ["paprika"],
  garlic: ["knoblauch"],
  oil: ["ol", "öl", "olivenol"],
  sugar: ["zucker"],
  salt: ["salz"],
  water: ["wasser"],
  juice: ["saft"],
  coffee: ["kaffee"],
  tea: ["tee"],
  cereal: ["muesli", "müsli", "cornflakes"],
  fish: ["fisch"],
  salmon: ["lachs"],
  tuna: ["thunfisch"],
  sausage: ["wurst"],
  ham: ["schinken"],
  cream: ["sahne"],
  ice: ["eis"],
  chocolate: ["schokolade"],
  snack: ["snack", "riegel"],
  frozen: ["tiefkuhl", "tiefkühl"],
  pizza: ["pizza"],
  sauce: ["sauce", "sose", "soße"],
};

/**
 * Unique query strings to send to Marktguru (original plus German synonyms).
 */
export function expandSearchQueries(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const out = new Set<string>([trimmed]);
  const lowerTokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);

  for (const token of lowerTokens) {
    const syns = SYNONYMS[token];
    if (!syns) {
      continue;
    }
    for (const syn of syns) {
      out.add(syn);
      const rebuilt = lowerTokens.map((t) => (t === token ? syn : t)).join(" ");
      out.add(rebuilt);
    }
  }

  return [...out];
}

/** Stems used to score result relevance (query tokens + German equivalents). */
export function getSearchStems(query: string): string[] {
  const n = normalizeText(query);
  const tokens = n.split(/\s+/).filter((t) => t.length >= 2);
  const stems = new Set<string>(tokens);

  for (const token of tokens) {
    const syns = SYNONYMS[token];
    if (syns) {
      for (const s of syns) {
        stems.add(normalizeText(s));
      }
    }
  }

  return [...stems];
}

function relevanceScore(deal: Deal, stems: string[], queryNormalized: string): number {
  const name = deal.normalizedProductName;
  let score = 0;

  for (const stem of stems) {
    if (!stem) {
      continue;
    }
    if (name.startsWith(stem)) {
      score += 100;
    } else if (name.includes(` ${stem}`) || name.includes(`${stem} `)) {
      score += 60;
    } else if (name.includes(stem)) {
      score += 25;
    }
  }

  // Searching fresh produce: deprioritize condiments that only substring-match "tomato"
  if (
    (queryNormalized.includes("tomat") || stems.some((s) => s.startsWith("tomat"))) &&
    (name.includes("ketchup") || name.includes("sauce") || name.includes("soße"))
  ) {
    score -= 120;
  }

  if (queryNormalized.includes("milch") && name.includes("schokolade")) {
    score -= 40;
  }

  return score;
}

/**
 * Deduped deals re-ranked: strongest textual match first, then cheapest.
 */
export function rankSearchDeals(deals: Deal[], originalQuery: string): Deal[] {
  const q = normalizeText(originalQuery);
  const stems = getSearchStems(originalQuery);

  return [...deals].sort((a, b) => {
    const sa = relevanceScore(a, stems, q);
    const sb = relevanceScore(b, stems, q);
    if (sb !== sa) {
      return sb - sa;
    }
    return a.price - b.price;
  });
}
