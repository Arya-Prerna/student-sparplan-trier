import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";

/** One Marktguru staple sweep per PLZ per revalidate window (shared by meals + top-deals). */
export const DEAL_POOL_REVALIDATE_SECONDS = 21600;

/**
 * Cached Marktguru deal pool for a postal code (staple searches, deduped).
 * Use from route handlers so unstable_cache applies.
 */
export function getCachedDealPoolForZip(zipCode: string) {
  const z = zipCode.trim() || "54290";
  return unstable_cache(
    () => fetchTopDealsForMealMatching(z),
    ["marktguru-deal-pool", z],
    { revalidate: DEAL_POOL_REVALIDATE_SECONDS }
  )();
}
