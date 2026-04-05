import { NextResponse } from "next/server";

import { fetchStores } from "@/lib/stores";

export async function GET() {
  try {
    const stores = await fetchStores();
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
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

