# Student Sparplan Trier

An AI-powered financial planning tool specifically designed for students living in Trier, Germany. This webiste helps manage budgets, track local discounts, and provides personalized cheap recipes.

## Live Demo
**[View Live Project](https://student-sparplan-trier.vercel.app)**

![App Screenshot](./screenshots/App-screenshot1.png)

An AI-powered financial planning tool...

## ✨ Features
- **AI Savings Advisor:** Personalized financial tips using Anthropic Claude.
- **Trier Localization:** Tailored advice for the local cost of living in Trier.
- **Budget Tracking:** Interactive UI to monitor student spending.
- **Modern Tech:** Built with Next.js 14 and Tailwind CSS.

## ✨ Tech Stack
- **Framework:** Next.js
- **AI:** Anthropic Claude API
- **Styling:** Tailwind CSS / Shadcn UI
- **Deployment:** Vercel

## ✨ Local Setup
1. Clone the repo: `git clone https://github.com/Arya-Prerna/student-sparplan-trier.git`
2. Install dependencies: `npm install`
3. Add your `ANTHROPIC_API_KEY` to `.env.local`
4. Run: `npm run dev`

## Product Summary

The app has three core sections:

1. **Deal Search**: Search grocery items and compare current prices across stores in Trier.
2. **Cheapest Meals This Week**: Use curated recipes and current offers to show low-cost meal options.
3. **Store Guide**: Show supermarket addresses and opening hours using free data sources.

## Data Sources

- Marktguru offers API (for deals and discounts)
- OpenStreetMap Overpass API (for store metadata and opening hours)
- Anthropic Haiku API (for recipe-to-offer matching, not recipe generation)


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
