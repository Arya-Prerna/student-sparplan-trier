import { NextRequest, NextResponse } from "next/server";

import { searchDeals } from "@/lib/marktguru";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const zipCode = request.nextUrl.searchParams.get("zipCode") ?? "54290";
  const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "24", 10);

  if (!q) {
    return NextResponse.json(
      { error: "Missing required query parameter 'q'." },
      { status: 400 }
    );
  }

  try {
    const deals = await searchDeals(q, {
      zipCode,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 50) : 24,
    });
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

