import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { fetchTopDealsForMealMatching } from "@/lib/marktguru";
import { normalizeText } from "@/lib/normalize";
import type { Deal, StudentPick } from "@/lib/types";

const DEFAULT_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

const aiPickSchema = z.object({
  /** Index into the provided deals list (preferred). */
  i: z.number().optional(),
  productName: z.string().optional(),
  store: z.string().optional(),
  reason: z.string(),
});

const aiPicksSchema = z.array(aiPickSchema);

function extractJsonArray(text: string) {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end >= start) {
    return text.slice(start, end + 1);
  }
  throw new Error("Could not find JSON array in model response.");
}

function findMatchingDealByName(
  pick: { productName?: string; store?: string },
  deals: Deal[]
): Deal | undefined {
  const rawName = pick.productName;
  if (!rawName) {
    return undefined;
  }

  const nameNorm = normalizeText(rawName);
  const storeHint = pick.store ? normalizeText(pick.store) : "";

  const byExact = deals.find(
    (d) =>
      normalizeText(d.productName) === nameNorm &&
      (!storeHint || normalizeText(d.store).includes(storeHint) || storeHint.includes(normalizeText(d.store)))
  );
  if (byExact) {
    return byExact;
  }

  const byName = deals.find(
    (d) =>
      normalizeText(d.productName).includes(nameNorm) ||
      nameNorm.includes(normalizeText(d.productName))
  );
  if (byName) {
    return byName;
  }

  if (storeHint) {
    const byStore = deals.find((d) => normalizeText(d.store).includes(storeHint));
    if (byStore) {
      return byStore;
    }
  }

  return deals.find((d) =>
    rawName
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.length > 3 && normalizeText(d.productName).includes(normalizeText(w)))
  );
}

function mergePicksWithDeals(
  parsed: z.infer<typeof aiPicksSchema>,
  deals: Deal[]
): StudentPick[] {
  const used = new Set<string>();
  const out: StudentPick[] = [];
  const remaining = () => deals.filter((d) => !used.has(d.id));

  for (const p of parsed) {
    let deal: Deal | undefined;

    if (
      typeof p.i === "number" &&
      Number.isInteger(p.i) &&
      p.i >= 0 &&
      p.i < deals.length
    ) {
      const candidate = deals[p.i];
      if (!used.has(candidate.id)) {
        deal = candidate;
      }
    }

    if (!deal) {
      deal = findMatchingDealByName(p, remaining());
    }

    if (deal) {
      used.add(deal.id);
      out.push({
        productName: deal.productName,
        store: deal.store,
        price: deal.price,
        imageUrl: deal.imageUrl,
        discountPercent: deal.discountPercent,
        reason: p.reason,
      });
    }

    if (out.length >= 10) {
      break;
    }
  }

  return out;
}

function fallbackPicks(deals: Deal[]): StudentPick[] {
  return deals.slice(0, 10).map((d) => ({
    productName: d.productName,
    store: d.store,
    price: d.price,
    imageUrl: d.imageUrl,
    discountPercent: d.discountPercent,
    reason: "Strong discount this week — good for a student basket.",
  }));
}

async function buildStudentPicks(zipCode: string): Promise<{
  picks: StudentPick[];
  sourceDealsCount: number;
  usedAi: boolean;
}> {
  const deals = await fetchTopDealsForMealMatching(zipCode);
  const top = [...deals]
    .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
    .slice(0, 60);

  if (top.length === 0) {
    return { picks: [], sourceDealsCount: 0, usedAi: false };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      picks: fallbackPicks(top),
      sourceDealsCount: deals.length,
      usedAi: false,
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const compact = top.map((d, i) => ({
    i,
    productName: d.productName,
    store: d.store,
    price: d.price,
    discountPercent: d.discountPercent ?? 0,
  }));

  const systemPrompt = `
You are a student grocery advisor in Germany.
Given discounted grocery deals (JSON), pick exactly 10 that are most useful for a broke student.
Prioritize: staple foods (pasta, rice, eggs, milk, bread, cheese, potatoes, vegetables), high discount %, low price.
Return ONLY a JSON array (no markdown) with exactly 10 objects:
[{"i": number, "reason": "one short English sentence"}]
Field "i" MUST be the index from the input deals (0-based). Do not invent indices.
`.trim();

  try {
    const message = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      temperature: 0.2,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: JSON.stringify({ deals: compact }, null, 2),
        },
      ],
    });

    const output = message.content
      .map((block) => ("text" in block ? block.text : ""))
      .join("\n");

    const parsedRaw = JSON.parse(extractJsonArray(output));
    const parsed = aiPicksSchema.parse(parsedRaw);
    const picks = mergePicksWithDeals(parsed, top);

    if (picks.length === 0) {
      return {
        picks: fallbackPicks(top),
        sourceDealsCount: deals.length,
        usedAi: false,
      };
    }

    return {
      picks,
      sourceDealsCount: deals.length,
      usedAi: true,
    };
  } catch (err) {
    console.error("[student-picks] Haiku curation failed, using discount sort:", err);
    return {
      picks: fallbackPicks(top),
      sourceDealsCount: deals.length,
      usedAi: false,
    };
  }
}

export async function GET(request: NextRequest) {
  const zipCode = request.nextUrl.searchParams.get("zipCode") ?? "54290";

  try {
    const getCached = unstable_cache(
      () => buildStudentPicks(zipCode),
      ["student-picks", zipCode],
      { revalidate: 21600 }
    );

    const { picks, sourceDealsCount, usedAi } = await getCached();

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      zipCode,
      sourceDealsCount,
      usedAi,
      picks,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load student picks.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
