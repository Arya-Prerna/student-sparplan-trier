import { normalizeText, parseNumber } from "@/lib/normalize";
import type { Deal, SearchDealsOptions } from "@/lib/types";

const DEFAULT_ZIP_CODE = "54290";
const DEFAULT_LIMIT = 24;
const DEFAULT_OFFSET = 0;
const DEFAULT_CACHE_SECONDS = 60 * 60 * 6;

const MARKTGURU_API_BASE =
  process.env.MARKTGURU_API_BASE ?? "https://api.marktguru.de/api/v1";

// Publicly-known web client keys used by Marktguru's web frontend.
// You can override them via environment variables if needed.
const MARKTGURU_API_KEY =
  process.env.MARKTGURU_API_KEY ??
  "8Kk+pmbf7TgJ9nVj2cXeA7P5zBGv8iuutVVMRfOfvNE=";
const MARKTGURU_CLIENT_KEY =
  process.env.MARKTGURU_CLIENT_KEY ??
  "WU/RH+PMGDi+gkZer3WbMelt6zcYHSTytNB7VpTia90=";

const KNOWN_STORES = [
  "Aldi Sud",
  "Lidl",
  "Kaufland",
  "Penny",
  "Netto",
  "Norma",
  "Edeka",
  "Thomas Philipps",
];

function getPathValue(input: unknown, path: string): unknown {
  if (!input || typeof input !== "object") {
    return undefined;
  }

  const parts = path.split(".");
  let current: unknown = input;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function getFirstString(input: unknown, paths: string[]): string | undefined {
  for (const path of paths) {
    const value = getPathValue(input, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function getFirstNumber(input: unknown, paths: string[]): number | undefined {
  for (const path of paths) {
    const value = getPathValue(input, path);
    const parsed = parseNumber(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }
  return undefined;
}

function collectRawOffers(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const directKeys = ["offers", "items", "results", "data"];
  const values = payload as Record<string, unknown>;

  for (const key of directKeys) {
    const value = values[key];
    if (Array.isArray(value)) {
      return value;
    }

    if (value && typeof value === "object") {
      for (const nestedKey of directKeys) {
        const nested = (value as Record<string, unknown>)[nestedKey];
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }
  }

  return [];
}

function normalizeStoreName(store: string) {
  const normalized = normalizeText(store);
  const known = KNOWN_STORES.find((candidate) =>
    normalizeText(candidate).includes(normalized) ||
    normalized.includes(normalizeText(candidate))
  );
  return known ?? store;
}

function rawToDeal(raw: unknown, index: number): Deal | null {
  const productName =
    getFirstString(raw, [
      "product.name",
      "product.title",
      "title",
      "name",
      "offerText",
      "headline",
    ]) ?? "Unbekanntes Produkt";

  const price = getFirstNumber(raw, [
    "price",
    "price.value",
    "price.amount",
    "newPrice",
    "currentPrice",
    "salePrice",
  ]);

  if (price === undefined) {
    return null;
  }

  const oldPrice = getFirstNumber(raw, [
    "oldPrice",
    "price.old",
    "formerPrice",
    "strikePrice",
    "discountPrice.oldPrice",
  ]);

  const discountFromPayload = getFirstNumber(raw, [
    "discountPercent",
    "discountPercentage",
    "discount",
  ]);

  const discountPercent =
    discountFromPayload ??
    (oldPrice && oldPrice > price
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : undefined);

  const storeName = normalizeStoreName(
    getFirstString(raw, [
      "advertiser.name",
      "retailer.name",
      "shop.name",
      "market.name",
      "brand.name",
      "store.name",
    ]) ?? "Unbekannter Markt"
  );

  const productId =
    getFirstString(raw, ["id", "offerId", "product.id", "product.ean"]) ??
    `${normalizeText(productName)}-${index}`;

  return {
    id: `${normalizeText(productId)}-${normalizeText(storeName)}`,
    productName,
    normalizedProductName: normalizeText(productName),
    store: storeName,
    price,
    oldPrice,
    discountPercent,
    imageUrl: getFirstString(raw, [
      "image.large",
      "image.medium",
      "image.small",
      "images.large",
      "imageUrl",
      "product.image",
      "product.imageUrl",
    ]),
    validFrom: getFirstString(raw, [
      "validFrom",
      "validity.from",
      "offerPeriod.start",
      "startDate",
    ]),
    validUntil: getFirstString(raw, [
      "validTo",
      "validity.to",
      "offerPeriod.end",
      "endDate",
    ]),
    category: getFirstString(raw, [
      "category.name",
      "product.category",
      "category",
    ]),
    unit: getFirstString(raw, ["unit", "product.unit", "price.unit"]),
    source: "marktguru",
    raw,
  };
}

function dedupeDeals(deals: Deal[]) {
  const seen = new Set<string>();
  const result: Deal[] = [];

  for (const deal of deals) {
    const key = `${deal.normalizedProductName}|${normalizeText(
      deal.store
    )}|${deal.price}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(deal);
  }

  return result;
}

export async function searchDeals(
  query: string,
  options: SearchDealsOptions = {}
): Promise<Deal[]> {
  const zipCode = options.zipCode ?? DEFAULT_ZIP_CODE;
  const limit = options.limit ?? DEFAULT_LIMIT;
  const offset = options.offset ?? DEFAULT_OFFSET;
  const cacheSeconds = options.cacheSeconds ?? DEFAULT_CACHE_SECONDS;

  const url = new URL(`${MARKTGURU_API_BASE}/offers/search`);
  url.searchParams.set("as", "web");
  url.searchParams.set("q", query);
  url.searchParams.set("zipCode", zipCode);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    headers: {
      "x-apikey": MARKTGURU_API_KEY,
      "x-clientkey": MARKTGURU_CLIENT_KEY,
      accept: "application/json",
    },
    next: {
      revalidate: cacheSeconds,
    },
  });

  if (!response.ok) {
    throw new Error(`Marktguru request failed (${response.status})`);
  }

  const payload: unknown = await response.json();
  const rawOffers = collectRawOffers(payload);
  const deals = rawOffers
    .map((offer, index) => rawToDeal(offer, index))
    .filter((deal): deal is Deal => Boolean(deal));

  return dedupeDeals(deals).sort((a, b) => a.price - b.price);
}

export async function fetchTopDealsForMealMatching() {
  const stapleQueries = [
    "pasta",
    "reis",
    "kartoffeln",
    "hackfleisch",
    "huhn",
    "eier",
    "milch",
    "kaese",
    "passierte tomaten",
    "brot",
    "joghurt",
    "apfel",
  ];

  const all = await Promise.all(
    stapleQueries.map((term) => searchDeals(term, { limit: 12 }))
  );

  const flattened = dedupeDeals(all.flat());
  return flattened
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, 120);
}

