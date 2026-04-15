import { promises as fs } from "node:fs";
import path from "node:path";

import {
  fetchOverpassSupermarkets,
  fetchOverpassSupermarketsByPostcode,
  type OverpassElement,
} from "@/lib/overpass";
import { normalizeText, slugify } from "@/lib/normalize";
import type { StoreInfo, StoreMeta } from "@/lib/types";

function buildAddress(tags: Record<string, string>) {
  const street = tags["addr:street"];
  const number = tags["addr:housenumber"];
  const postcode = tags["addr:postcode"];
  const city = tags["addr:city"];

  const firstLine = [street, number].filter(Boolean).join(" ").trim();
  const secondLine = [postcode, city].filter(Boolean).join(" ").trim();

  return [firstLine, secondLine].filter(Boolean).join(", ");
}

async function loadStoreMeta() {
  const filePath = path.join(process.cwd(), "data", "stores-meta.json");

  try {
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content) as StoreMeta[];
    return parsed;
  } catch {
    return [] satisfies StoreMeta[];
  }
}

function normalizeBrand(value: string) {
  const plain = normalizeText(value);
  const aliases: Record<string, string> = {
    "aldi sud": "Aldi Sud",
    lidl: "Lidl",
    kaufland: "Kaufland",
    penny: "Penny",
    netto: "Netto",
    norma: "Norma",
    edeka: "Edeka",
    "thomas philipps": "Thomas Philipps",
  };

  for (const [key, label] of Object.entries(aliases)) {
    if (plain.includes(key)) {
      return label;
    }
  }

  return value;
}

function mapElementsToStores(
  elements: OverpassElement[],
  meta: StoreMeta[]
): StoreInfo[] {
  const mapped: Array<StoreInfo | null> = elements.map((element): StoreInfo | null => {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    const brand = tags.brand?.trim();

    if (!name && !brand) {
      return null;
    }

    const displayName = normalizeBrand(name ?? brand ?? "Supermarket");
    const slug = slugify(displayName);
    const metadata = meta.find(
      (entry) =>
        normalizeText(entry.slug) === slug || normalizeText(entry.name) === slug
    );

    const postcode = tags["addr:postcode"]?.trim();

    return {
      id: `store-${element.id}`,
      name: displayName,
      brand: brand ? normalizeBrand(brand) : undefined,
      address: buildAddress(tags),
      postcode: postcode || undefined,
      openingHours: tags.opening_hours || tags["opening_hours:store"],
      lat: element.lat ?? element.center?.lat,
      lon: element.lon ?? element.center?.lon,
      notes: metadata?.notes,
      source: "overpass" as const,
    };
  });

  const validStores = mapped.filter((store): store is StoreInfo => store !== null);

  const deduped = new Map<string, StoreInfo>();
  for (const store of validStores) {
    const key = `${normalizeText(store.name)}|${normalizeText(store.address ?? "")}`;
    if (!deduped.has(key)) {
      deduped.set(key, store);
    }
  }

  return [...deduped.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchStores(
  cacheSeconds = 60 * 60 * 24,
  zipCode?: string
): Promise<{ stores: StoreInfo[]; relaxedPlzFilter: boolean }> {
  const meta = await loadStoreMeta();
  const z = zipCode?.trim();

  if (z) {
    const strictPayload = await fetchOverpassSupermarketsByPostcode(z, cacheSeconds);
    const strictElements = strictPayload.elements ?? [];
    if (strictElements.length > 0) {
      const stores = mapElementsToStores(strictElements, meta);
      return { stores, relaxedPlzFilter: false };
    }

    const fullPayload = await fetchOverpassSupermarkets(cacheSeconds);
    const allStores = mapElementsToStores(fullPayload.elements ?? [], meta);
    const filtered = allStores.filter(
      (s) => s.postcode === z || Boolean(s.address?.replace(/\s/g, "").includes(z))
    );
    return {
      stores: filtered.length > 0 ? filtered : allStores,
      relaxedPlzFilter: true,
    };
  }

  const payload = await fetchOverpassSupermarkets(cacheSeconds);
  const stores = mapElementsToStores(payload.elements ?? [], meta);
  return { stores, relaxedPlzFilter: false };
}
