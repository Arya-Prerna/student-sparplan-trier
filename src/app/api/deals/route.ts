import { NextRequest, NextResponse } from "next/server";

import { fetchTopDealsForMealMatching, searchDeals } from "@/lib/marktguru";
import { normalizeText } from "@/lib/normalize";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const store = request.nextUrl.searchParams.get("store")?.trim() ?? "";
  const category = request.nextUrl.searchParams.get("category")?.trim() ?? "";
  const zipCode = (request.nextUrl.searchParams.get("zipCode") ?? "54290").trim();
  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 50;

  try {
    const deals = q
      ? await searchDeals(q, {
          limit: Math.min(Math.max(limit, 1), 80),
          zipCode,
        })
      : await fetchTopDealsForMealMatching(zipCode);

    const filtered = deals
      .filter((deal) => {
        if (store && !normalizeText(deal.store).includes(normalizeText(store))) {
          return false;
        }
        if (
          category &&
          !normalizeText(deal.category ?? "uncategorized").includes(normalizeText(category))
        ) {
          return false;
        }
        return true;
      })
      .slice(0, Math.min(Math.max(limit, 1), 120));

    return NextResponse.json({ deals: filtered });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch deals.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

