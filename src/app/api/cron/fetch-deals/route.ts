import { type NextRequest, NextResponse } from "next/server";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { scrapeKauflandWeeklyOffers } from "@/lib/scrapers/kaufland";

function isAuthorizedCron(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return true;
  }
  if (request.headers.get("x-vercel-cron") === "1") {
    return true;
  }
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const zipParam = request.nextUrl.searchParams.get("zipCode")?.trim();
  const zipCode = zipParam && /^\d{5}$/.test(zipParam) ? zipParam : "54290";

  try {
    const [marktguruDeals, kauflandDeals] = await Promise.all([
      fetchTopDealsForMealMatching(zipCode),
      scrapeKauflandWeeklyOffers().catch(() => []),
    ]);

    // We don't persist in MVP. This endpoint warms Next.js fetch caches
    // and gives visibility into current source coverage.
    return NextResponse.json({
      warmedAt: new Date().toISOString(),
      zipCode,
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

