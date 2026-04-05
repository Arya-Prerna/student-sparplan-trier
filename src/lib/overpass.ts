/**
 * OpenStreetMap Overpass API client for supermarket nodes/ways in Trier.
 * Store hours and coordinates change rarely — use long revalidate in callers.
 */

export const OVERPASS_ENDPOINT =
  process.env.OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";

/** Query supermarkets inside Trier administrative boundary (nodes, ways, relations). */
export const OVERPASS_SUPERMARKETS_QUERY = `
[out:json][timeout:25];
area["name"="Trier"]["boundary"="administrative"]->.searchArea;
(
  node["shop"="supermarket"](area.searchArea);
  way["shop"="supermarket"](area.searchArea);
  relation["shop"="supermarket"](area.searchArea);
);
out center tags;
`;

export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
}

export interface OverpassResponse {
  elements?: OverpassElement[];
}

/**
 * POST to Overpass interpreter; returns parsed JSON (supermarket elements).
 * Uses Next.js fetch cache with `revalidate` (default 24h).
 */
export async function fetchOverpassSupermarkets(
  cacheSeconds = 60 * 60 * 24
): Promise<OverpassResponse> {
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
    },
    body: OVERPASS_SUPERMARKETS_QUERY,
    next: {
      revalidate: cacheSeconds,
    },
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed (${response.status})`);
  }

  return (await response.json()) as OverpassResponse;
}
