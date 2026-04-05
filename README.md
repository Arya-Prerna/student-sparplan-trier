# Student Sparplan Trier

Student Sparplan Trier helps students find the cheapest grocery options in Trier and decide what to cook based on current discounts.

This repository currently contains planning and product documentation.

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

## Security Notes

- Never commit secrets.
- Keep API keys in `.env.local` (local only) and deployment provider secrets.
- Use `.env.example` as the template for required variables.
