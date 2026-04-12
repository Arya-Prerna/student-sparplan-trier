import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";

/** One Marktguru staple sweep per PLZ per revalidate window (shared by meals + top-deals). */
const REVALIDATE_SECONDS = 21600;

/**
 * Cached Marktguru deal pool for a postal code (staple searches, deduped, discount-sorted upstream).
 * Use from route handlers so unstable_cache applies.
 */
export function getCachedDealPoolForZip(zipCode: string) {
  return unstable_cache(
    () => fetchTopDealsForMealMatching(zipCode),
    ["marktguru-deal-pool", zipCode],
    { revalidate: REVALIDATE_SECONDS }
  )();
}
