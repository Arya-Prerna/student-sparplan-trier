# Project Log

## Purpose

This document is the complete running log for Student Sparplan Trier.  
It is designed so a new contributor can understand:

1. what decisions were made
2. why they were made
3. what was executed
4. what remains open

Keep this file updated after every meaningful change.

---

## Project Metadata

- Project: Student Sparplan Trier
- Owner: Prerna Arya
- Started: 2026-04-05
- Current Phase: MVP implementation complete, deployment pending
- Source of truth docs:
  - `PRD.md`
  - `docs/IMPLEMENTATION_PLAN.md`

---

## High-Level Timeline

### 2026-04-05: Product Direction Lock

- Initial concept: grocery discount comparison for Trier.
- Clarified differentiation: student-focused decision helper, not generic offer listing.
- Confirmed key product pillars:
  1. search cheapest offers
  2. cheapest meal recommendations from real offers
  3. store guide with opening hours

### 2026-04-05: Data Source Validation

- Marktguru validated as primary offer source for Trier stores:
  - Aldi Sud, Lidl, Kaufland, Penny, Netto, Norma, EDEKA, Thomas Philipps
- Gap identified:
  - Wasgau not covered
- Decision:
  - defer Wasgau to v2

### 2026-04-05: Cost Strategy

- Requirement: broke-student-friendly stack, mostly free.
- Chosen stack:
  - Next.js on Vercel free tier
  - Overpass API (free)
  - Marktguru API access pattern used via server proxy
  - Anthropic Haiku for matching only
- Important guardrail:
  - no AI-generated recipes, only AI-assisted matching on curated recipe set

### 2026-04-05: MVP App Implementation

- Scaffolded Next.js 16 + TypeScript + Tailwind in repo root.
- Added API routes:
  - `/api/search`
  - `/api/meals`
  - `/api/stores`
  - `/api/products`
  - `/api/deals`
  - `/api/cron/fetch-deals`
- Implemented integrations:
  - Marktguru offer client with normalization
  - Overpass store-hours client
  - Haiku recipe-to-offer matching with strict JSON parsing and fallback matcher
- Added curated dataset:
  - `data/recipes.json` (24 recipes)
  - `data/stores-meta.json`
- Built UI:
  - home page with 3 tabs (search, meals, store guide)
  - compare page
  - category page
  - deals-by-store page
- Added deployment config:
  - `vercel.json` weekly cron cache warm endpoint

---

## Decision Log (Authoritative)

| ID | Date | Decision | Reason | Impact | Status |
|----|------|----------|--------|--------|--------|
| D-001 | 2026-04-05 | Build Trier-only MVP first | Local focus increases usefulness and lowers complexity | Faster execution, stronger fit | Accepted |
| D-002 | 2026-04-05 | No database for MVP | Live APIs + cache are enough initially | Lower ops burden and cost | Accepted |
| D-003 | 2026-04-05 | No cron jobs in MVP | Pull + cache pattern is simpler | Less infrastructure complexity | Accepted |
| D-004 | 2026-04-05 | Use curated recipes only | Maintain quality/control and avoid AI hallucinations | Safer, predictable outputs | Accepted |
| D-005 | 2026-04-05 | Use Haiku only for matching/ranking | Need fuzzy matching between ingredients and offers | Better recommendations with low cost | Accepted |
| D-006 | 2026-04-05 | Use Overpass for store hours | Free and sufficient for MVP | Avoid Google Maps billing | Accepted |
| D-007 | 2026-04-05 | Defer Wasgau to v2 | Missing in primary source and not blocking launch | Keeps scope realistic | Accepted |
| D-008 | 2026-04-05 | Never commit API keys | Public repo requirement + security best practice | Prevents credential leakage | Accepted |
| D-009 | 2026-04-05 | Add deterministic fallback for meal matching | App should still work if Anthropic key is missing or API fails | Better reliability and lower operational risk | Accepted |
| D-010 | 2026-04-05 | Keep cron endpoint as cache warmer only | Supports scheduled refresh without DB complexity | Preserves no-database architecture while enabling weekly updates | Accepted |

---

## Execution Log

### Session: 2026-04-05 (Documentation + Repo Prep)

Completed:

1. Created project directory structure for documentation.
2. Added `README.md` with project summary and doc references.
3. Added comprehensive `PRD.md`.
4. Added this complete project log (`PROJECT_LOG.md`).
5. Added implementation plan copy (`docs/IMPLEMENTATION_PLAN.md`).
6. Added `.gitignore` and `.env.example` for secure setup.
7. Updated external plan artifact to include:
   - PRD deliverable
   - complete log deliverable
   - public GitHub push deliverable
8. Initialized git repository (`main`) and created first commit:
   - commit: `65665a3`
   - message: `docs: bootstrap product documentation and execution plan`
9. Connected and pushed to public GitHub repository:
   - repo: `https://github.com/Arya-Prerna/student-sparplan-trier`
   - branch: `main`
   - latest commit at push time: `d018dfe`

Pending:

1. Start application implementation (Phase 1 scaffold).

### Session: 2026-04-05 (Implementation Sweep)

Completed:

1. Installed Node.js and scaffolded Next.js app in the existing documentation repo.
2. Added core libs and dependencies (`@anthropic-ai/sdk`, `zod`, `cheerio`, UI helpers).
3. Implemented `src/lib/marktguru.ts` with resilient normalization and caching.
4. Implemented `src/lib/stores.ts` for Overpass supermarket + opening hour retrieval.
5. Implemented `src/lib/recipe-matcher.ts` with:
   - strict JSON schema validation for model output
   - fallback deterministic matcher when AI is unavailable
6. Added API routes for search, meals, stores, products, deals, and cron warm.
7. Added UI components and pages for:
   - search experience
   - meal recommendations
   - store guide
   - compare and category browsing
8. Added curated data sources (`data/recipes.json`, `data/stores-meta.json`).
9. Added deployment config (`vercel.json`) and local env template wiring.
10. Passed quality gates:
    - `npm run lint`
    - `npm run build`

Pending:

1. Set real API keys in `.env.local` (local) and Vercel project secrets.
2. Deploy to Vercel production.
3. Confirm production behavior on live URL.

---

## Integration Notes

### Marktguru Integration Notes

- Use backend route as proxy so browser never sees upstream credential headers.
- Normalize output into internal offer type to protect against upstream format changes.

### Haiku Integration Notes

- Prompt should require strict JSON output.
- Validate response with schema before rendering.
- Add fallback behavior when matching fails:
  - show curated low-cost recipes without dynamic pricing.

### Overpass Integration Notes

- Opening hours can be missing or unevenly formatted.
- UI should show explicit fallback when data is absent.

---

## Security and Secrets Log

### Policy

1. Secrets stay in local `.env.local` and platform secret manager.
2. Repository keeps placeholders in `.env.example` only.
3. Never paste secrets into tracked files, issues, or commit messages.

### Current Secret Requirements

- `ANTHROPIC_API_KEY`
- `MARKTGURU_API_KEY`
- `MARKTGURU_CLIENT_KEY`

---

## Source References

Primary external references used in planning:

1. gstack repository and README:
   - <https://github.com/garrytan/gstack>
2. Marktguru community API usage reference:
   - <https://www.smarthomeyourself.de/wiki/preisvergleich-mit-marktguru-de>
3. OpenStreetMap / Overpass docs:
   - <https://dev.overpass-api.de/overpass-doc/en/preface/preface.html>
4. OpenStreetMap opening hours key reference:
   - <https://wiki.openstreetmap.org/wiki/Key:opening_hours:store>

---

## Change Log (File-Level)

| Date | File | Change Summary |
|------|------|----------------|
| 2026-04-05 | `README.md` | Added project overview and documentation map |
| 2026-04-05 | `PRD.md` | Added full product requirements and acceptance criteria |
| 2026-04-05 | `PROJECT_LOG.md` | Added detailed decision/execution log template and first entries |
| 2026-04-05 | `docs/IMPLEMENTATION_PLAN.md` | Added implementation plan snapshot |
| 2026-04-05 | `.gitignore` | Added standard ignores and secret protection |
| 2026-04-05 | `.env.example` | Added environment variable template |
| 2026-04-05 | `src/**` | Added full Next.js app implementation (API routes, pages, components, libs) |
| 2026-04-05 | `data/recipes.json` | Added curated recipe dataset for meal matching |
| 2026-04-05 | `data/stores-meta.json` | Added Trier store notes and budget metadata |
| 2026-04-05 | `vercel.json` | Added weekly cron warm endpoint configuration |

---

## Open Items

1. Add production keys to Vercel project settings.
2. Perform first production deploy and smoke-test all API routes.
3. Decide Wasgau v2 integration path (direct source vs aggregator).

---

## Template For Future Entries

Use this block for each future work session:

```md
### Session: YYYY-MM-DD (title)

Completed:
1.
2.

Decisions:
- D-xxx:

Issues:
- issue:
- mitigation:

Next:
1.
2.
```
