import { unstable_cache } from "next/cache";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";

/** Align with meal / student-picks routes: one Marktguru staple sweep per PLZ per window. */
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
