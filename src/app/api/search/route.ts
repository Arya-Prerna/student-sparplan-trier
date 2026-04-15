import { NextRequest, NextResponse } from "next/server";

import { dedupeDeals, searchDeals } from "@/lib/marktguru";
import { expandSearchQueries, rankSearchDeals } from "@/lib/searchSynonyms";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const zipCode = (request.nextUrl.searchParams.get("zipCode") ?? "54290").trim();
  const rawLimit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "24", 10);
  const limit = Number.isFinite(rawLimit) ? rawLimit : 24;

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'." },
      { status: 400 }
    );
  }

  try {
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 24;
    const queries = expandSearchQueries(q);
    const perQuery = Math.min(
      50,
      Math.max(12, Math.ceil((safeLimit * 1.5) / Math.max(queries.length, 1)))
    );

    const batches = await Promise.all(
      queries.map((query) =>
        searchDeals(query, {
          zipCode,
          limit: perQuery,
        })
      )
    );

    const merged = dedupeDeals(batches.flat());
    const deals = rankSearchDeals(merged, q).slice(0, safeLimit);

    return NextResponse.json({ deals });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch deals from Marktguru.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}

