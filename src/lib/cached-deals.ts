import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";

/** Deal pool TTL (seconds). Shared by meals API and top-deals. */
export const DEAL_POOL_REVALIDATE_SECONDS = 7200;

function trimZip(zipCode: string): string {
  return zipCode.trim().slice(0, 10);
}

/**
 * Cached Marktguru deal pool for a postal code (staple searches, deduped).
 * Use from route handlers so unstable_cache applies.
 */
export function getCachedDealPoolForZip(zipCode: string) {
  const z = trimZip(zipCode);
  return unstable_cache(
    () => fetchTopDealsForMealMatching(z),
    ["marktguru-deal-pool", z],
    { revalidate: DEAL_POOL_REVALIDATE_SECONDS }
  )();
}
