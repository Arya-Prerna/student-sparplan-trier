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
  "ALDI SUD",
  "Lidl",
  "Kaufland",
  "Penny",
  "Netto",
  "Netto Marken-Discount",
  "Norma",
  "Edeka",
  "EDEKA",
  "REWE",
  "Thomas Philipps",
  "nahkauf",
];

const MARKTGURU_IMAGE_CDN =
  process.env.MARKTGURU_IMAGE_CDN ?? "https://mg2de.b-cdn.net/api/v1";

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

function getOfferNumericId(raw: unknown): number | undefined {
  const id = getFirstNumber(raw, ["id", "offerId"]);
  return id !== undefined && Number.isFinite(id) ? Math.floor(id) : undefined;
}

function getImageCount(raw: unknown): number {
  const images = getPathValue(raw, "images");
  if (images && typeof images === "object" && "count" in (images as object)) {
    const c = (images as Record<string, unknown>).count;
    return typeof c === "number" && c > 0 ? c : 0;
  }
  return 0;
}

function buildOfferImageUrl(offerId: number): string {
  return `${MARKTGURU_IMAGE_CDN}/offers/${offerId}/images/default/0/medium.webp`;
}

/** Marktguru puts the supermarket chain in advertisers[0].name, not brand.name. */
function getRetailerName(raw: unknown): string | undefined {
  const advertisers = getPathValue(raw, "advertisers");
  if (Array.isArray(advertisers) && advertisers.length > 0) {
    const first = advertisers[0];
    if (first && typeof first === "object" && "name" in first) {
      const name = (first as Record<string, unknown>).name;
      if (typeof name === "string" && name.trim()) {
        return name.trim();
      }
    }
  }
  return getFirstString(raw, [
    "advertiser.name",
    "retailer.name",
    "shop.name",
    "market.name",
    "store.name",
  ]);
}

function formatValidityDate(iso: unknown): string | undefined {
  if (typeof iso !== "string" || !iso.trim()) {
    return undefined;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return undefined;
  }
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getValidityFromRaw(raw: unknown): { validFrom?: string; validUntil?: string } {
  const vd = getPathValue(raw, "validityDates");
  if (!Array.isArray(vd) || vd.length === 0) {
    return {};
  }
  const first = vd[0];
  if (!first || typeof first !== "object") {
    return {};
  }
  const rec = first as Record<string, unknown>;
  return {
    validFrom: formatValidityDate(rec.from),
    validUntil: formatValidityDate(rec.to),
  };
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
    ]) ?? "Unknown product";

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

  const retailer = getRetailerName(raw);
  const storeName = normalizeStoreName(retailer ?? "Unknown store");

  const offerNumericId = getOfferNumericId(raw);
  const imageCount = getImageCount(raw);
  const directImageUrl = getFirstString(raw, [
    "image.large",
    "image.medium",
    "image.small",
    "images.urls.large",
    "images.urls.medium",
    "images.large",
    "imageUrl",
    "product.image",
    "product.imageUrl",
  ]);
  const imageUrl =
    directImageUrl ??
    (offerNumericId !== undefined && imageCount > 0
      ? buildOfferImageUrl(offerNumericId)
      : undefined);

  const { validFrom, validUntil } = getValidityFromRaw(raw);

  const productId =
    getFirstString(raw, ["id", "offerId", "product.id", "product.ean"]) ??
    `${normalizeText(productName)}-${index}`;

  return {
    id: `${normalizeText(String(productId))}-${normalizeText(storeName)}`,
    productName,
    normalizedProductName: normalizeText(productName),
    store: storeName,
    price,
    oldPrice,
    discountPercent,
    imageUrl,
    validFrom,
    validUntil,
    category: getFirstString(raw, [
      "categories.0.name",
      "category.name",
      "product.category",
      "category",
    ]),
    unit: getFirstString(raw, [
      "unit.shortName",
      "unit.name",
      "product.unit",
      "unit",
    ]),
    source: "marktguru",
    raw,
  };
}

export function dedupeDeals(deals: Deal[]) {
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

export async function fetchTopDealsForMealMatching(zipCode: string = DEFAULT_ZIP_CODE) {
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
    stapleQueries.map((term) => searchDeals(term, { limit: 12, zipCode }))
  );

  const flattened = dedupeDeals(all.flat());
  return flattened
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, 120);
}

