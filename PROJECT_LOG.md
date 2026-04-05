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
- Current Phase: Documentation and repository setup
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

Pending:

1. Initialize git and create first commit.
2. Create/connect public GitHub repo.
3. Push branch to GitHub.

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

---

## Open Items

1. Confirm repository URL and public visibility after push.
2. Confirm final naming convention for app branding.
3. Start implementation phase (scaffold and API adapters).

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
