import { NextRequest, NextResponse } from "next/server";

import { fetchTopDealsForMealMatching, searchDeals } from "@/lib/marktguru";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const zipCode = (request.nextUrl.searchParams.get("zipCode") ?? "54290").trim();
  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "30", 10);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 30;

  try {
    const deals = q
      ? await searchDeals(q, { limit: Math.min(Math.max(limit, 1), 50), zipCode })
      : await fetchTopDealsForMealMatching(zipCode);

    const products = [...new Map(deals.map((deal) => [deal.normalizedProductName, deal])).values()]
      .slice(0, Math.min(Math.max(limit, 1), 80))
      .map((deal) => ({
        id: deal.id,
        name: deal.productName,
        normalizedName: deal.normalizedProductName,
        category: deal.category,
        cheapestPrice: deal.price,
        store: deal.store,
        imageUrl: deal.imageUrl,
      }));

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch products.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

