import { NextResponse } from "next/server";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { scrapeKauflandWeeklyOffers } from "@/lib/scrapers/kaufland";

export async function GET() {
  try {
    const [marktguruDeals, kauflandDeals] = await Promise.all([
      fetchTopDealsForMealMatching(),
      scrapeKauflandWeeklyOffers().catch(() => []),
    ]);

    // We don't persist in MVP. This endpoint warms Next.js fetch caches
    // and gives visibility into current source coverage.
    return NextResponse.json({
      warmedAt: new Date().toISOString(),
      marktguruDeals: marktguruDeals.length,
      kauflandDeals: kauflandDeals.length,
      totalDeals: marktguruDeals.length + kauflandDeals.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to warm deals cache.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

