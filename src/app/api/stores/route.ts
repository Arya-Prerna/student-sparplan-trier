import { type NextRequest, NextResponse } from "next/server";

import { fetchStores } from "@/lib/stores";

export async function GET(request: NextRequest) {
  try {
    const zipCode = request.nextUrl.searchParams.get("zipCode")?.trim();
    const { stores, relaxedPlzFilter } = await fetchStores(60 * 60 * 24, zipCode);
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      zipCode: zipCode ?? null,
      relaxedPlzFilter,
      stores,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch store details from Overpass API.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
