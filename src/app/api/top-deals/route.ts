import { type NextRequest, NextResponse } from "next/server";

import { getCachedDealPoolForZip } from "@/lib/cached-deals";
import { pickDiverseTopDeals } from "@/lib/marktguru";

export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams.get("zipCode") ?? "54290";

  try {
    const pool = await getCachedDealPoolForZip(zipCode);
    const deals = pickDiverseTopDeals(pool, 12, 3);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      zipCode,
      sourceDealsCount: pool.length,
      deals,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load top deals.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
