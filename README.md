# Student Sparplan Trier

Student Sparplan Trier helps students find the cheapest grocery options in Trier and decide what to cook based on current discounts.

This repository now contains a working Next.js app plus full planning documentation.

## Documents

- `PRD.md`: Full product requirements document
- `PROJECT_LOG.md`: Detailed decision and execution log
- `docs/IMPLEMENTATION_PLAN.md`: Implementation plan and phased roadmap

## Product Summary

The app has three core sections:

1. **Deal Search**: Search grocery items and compare current prices across stores in Trier.
2. **Cheapest Meals This Week**: Use curated recipes and current offers to show low-cost meal options.
3. **Store Guide**: Show supermarket addresses and opening hours using free data sources.

## Data Sources

- Marktguru offers API (for deals and discounts)
- OpenStreetMap Overpass API (for store metadata and opening hours)
- Anthropic Haiku API (for recipe-to-offer matching, not recipe generation)

## Local Development

1. Install dependencies:
   - `npm install`
2. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Set `ANTHROPIC_API_KEY`
   - Optionally set Marktguru headers if you want custom credentials
3. Run development server:
   - `npm run dev`
4. Open:
   - [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app/page.tsx`: Single-page UI with 3 tabs
- `src/app/api/search/route.ts`: Offer search endpoint
- `src/app/api/meals/route.ts`: Cheapest meals endpoint
- `src/app/api/stores/route.ts`: Store guide endpoint
- `src/lib/marktguru.ts`: Marktguru client and normalization
- `src/lib/stores.ts`: Overpass store-hours client
- `src/lib/recipe-matcher.ts`: Haiku + fallback matching logic
- `data/recipes.json`: Curated recipe dataset
- `data/stores-meta.json`: Store notes and budget ratings

## Security Notes

- Never commit secrets.
- Keep API keys in `.env.local` (local only) and deployment provider secrets.
- Use `.env.example` as the template for required variables.
