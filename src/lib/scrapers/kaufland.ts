import * as cheerio from "cheerio";

import { normalizeText, parseNumber } from "@/lib/normalize";
import type { Deal } from "@/lib/types";

const KAUFLAND_OFFERS_URL =
  process.env.KAUFLAND_OFFERS_URL ??
  "https://filiale.kaufland.de/prospekte-und-angebote.html";

export async function scrapeKauflandWeeklyOffers(cacheSeconds = 60 * 60 * 12) {
  const response = await fetch(KAUFLAND_OFFERS_URL, {
    next: {
      revalidate: cacheSeconds,
    },
    headers: {
      "user-agent": "Mozilla/5.0 (StudentSparplanBot/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Kaufland scraping failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const deals: Deal[] = [];

  // Generic fallback parser: many offer pages expose product card-like structures.
  $(".offer-card, .product-card, [data-offer], .teaser--offer").each((index, node) => {
    const element = $(node);
    const productName =
      element.find(".title, .product-title, h3, h2").first().text().trim() ||
      element.attr("data-name") ||
      "";

    const priceText =
      element.find(".price, .product-price, .price-value").first().text().trim() ||
      element.attr("data-price") ||
      "";

    const price = parseNumber(priceText);

    if (!productName || price === undefined) {
      return;
    }

    deals.push({
      id: `kaufland-${index}-${normalizeText(productName)}`,
      productName,
      normalizedProductName: normalizeText(productName),
      store: "Kaufland",
      price,
      oldPrice: parseNumber(
        element.find(".old-price, .price-old").first().text().trim() || undefined
      ),
      discountPercent: parseNumber(
        element.find(".discount, .discount-percent").first().text().trim() || undefined
      ),
      imageUrl:
        element.find("img").first().attr("src") ||
        element.find("img").first().attr("data-src") ||
        undefined,
      source: "manual",
    });
  });

  return deals;
}

