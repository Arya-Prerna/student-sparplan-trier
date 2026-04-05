# Product Requirements Document (PRD)

## 1) Document Control

- Product Name: Student Sparplan Trier
- Owner: Prerna Arya
- Status: Draft v1
- Last Updated: 2026-04-05
- Audience: Engineers, designers, contributors, reviewers, future collaborators

---

## 2) Executive Summary

Student Sparplan Trier is a student-first grocery savings web app focused on Trier, Germany.  
The app helps users answer three practical questions:

1. Where is a specific grocery item cheapest this week?
2. What low-cost meals can I cook this week using discounted ingredients?
3. Which supermarket is open right now and where is it located?

The core value is not generic price comparison. The core value is local, student-oriented decision support.

---

## 3) Problem Statement

Students in Trier are price-sensitive and typically compare weekly offers manually across multiple stores (Aldi, Lidl, Kaufland, Penny, etc.). This is time-consuming and inconsistent.

Current behavior is fragmented:
- browsing multiple flyer pages/apps
- switching between apps/maps for store locations/hours
- no practical "meal-level" recommendation from available offers

Result:
- avoidable overspending
- poor visibility into real weekly savings
- high friction for meal planning on a budget

---

## 4) Product Vision

Build the most useful "broke student grocery assistant" for Trier:

- simple enough to use in 20 seconds on mobile
- actionable enough to influence same-day shopping decisions
- local enough to reflect actual stores and weekly offer reality

---

## 5) Goals and Non-Goals

### 5.1 Goals (MVP)

1. Provide product search across Trier grocery offers, sorted by lowest price.
2. Provide "Cheapest Meals This Week" from curated recipes matched to current offers.
3. Provide a Trier store guide with opening hours and addresses.
4. Keep operational cost near zero (free data sources + low API spend).
5. Deploy publicly on Vercel.

### 5.2 Non-Goals (MVP)

1. Full Germany-wide coverage.
2. User accounts, authentication, social features.
3. Automated checkout or grocery delivery integration.
4. AI-generated recipes (explicitly out of scope).
5. Complex analytics stack or paid observability tools.

---

## 6) Target Users and Personas

### Primary Persona: "Budget-Conscious Student"

- Lives in Trier
- Shops weekly with strict budget constraints
- Wants practical savings, not abstract analytics
- Uses phone-first browsing

### Secondary Persona: "WG / Flatshare Shopper"

- Buys groceries for 2-4 people
- Needs quick cost comparisons and cheap meal ideas
- Cares about store opening times and convenience

---

## 7) User Jobs To Be Done (JTBD)

1. "When I search for a product, I want to see the cheapest current option nearby so I can save money immediately."
2. "When I plan meals for the week, I want cheap recipe options based on real offers so I can control spending."
3. "When I decide where to shop, I want store opening times and location context so I do not waste time."

---

## 8) Scope

### 8.1 In Scope (MVP)

1. Trier-only grocery focus.
2. Offer search with live deal retrieval.
3. Curated recipe dataset (manually authored).
4. Haiku-assisted matching from recipe ingredients to active offers.
5. Store guide with opening hours from free map data.

### 8.2 Out of Scope (MVP)

1. Payment flows.
2. Recommender personalization by account history.
3. Real-time in-store stock accuracy.
4. Community posting and moderation.

---

## 9) Competitive Context

Existing tools (example: Marktguru) already aggregate offers.  
Student Sparplan Trier differentiates by combining:

1. local Trier focus
2. meal-level budget guidance
3. single-page utility for search + meal decisions + store hours

---

## 10) Functional Requirements

### FR-1: Offer Search

- User enters text query (example: "Milch", "Pasta", "Eier").
- System fetches current offer matches for zipCode 54290.
- Results include:
  - product name
  - current price
  - old price (if available)
  - discount percent (if derivable)
  - store name
  - validity window
  - image (if available)
- Results sorted lowest price first.

### FR-2: Cheapest Meals This Week

- System loads curated recipes from local data file.
- System loads active offer set.
- System uses Anthropic Haiku to map recipe ingredients to available offers.
- Output includes 5-7 ranked meal cards with:
  - recipe name
  - estimated total ingredient cost
  - ingredient-to-offer mapping
  - store recommendations
  - prep time and servings

### FR-3: Store Guide

- System fetches Trier supermarket points from Overpass API.
- System displays:
  - store name / brand
  - address
  - opening hours
  - optional notes (manual metadata)

### FR-4: Caching and Stability

- Deal responses cached for fixed TTL (initial target: 6h).
- Meal matching results cached for same TTL window.
- Store hour data cached longer (initial target: 24h+).

### FR-5: Security and Secrets

- API keys never exposed to frontend client.
- API keys kept server-side in environment variables.
- No secret values committed to repository.

---

## 11) Non-Functional Requirements

1. **Performance**: Initial page load and key interactions should feel fast on average student mobile connections.
2. **Availability**: Graceful fallback UI when an upstream API is unavailable.
3. **Maintainability**: Clear module boundaries and typed interfaces.
4. **Cost efficiency**: Stay within free tiers and very low monthly AI spend.
5. **Privacy**: No personal account requirement in MVP.

---

## 12) Data Sources and Contracts

### 12.1 Marktguru Offers API

- Purpose: Current grocery offers and discount metadata.
- Access: Server-side proxy route.
- Required headers:
  - `x-apikey`
  - `x-clientkey`
- Query model:
  - `q` (search term)
  - `zipCode=54290`
  - pagination options

### 12.2 OpenStreetMap Overpass API

- Purpose: Store points and opening hours.
- Access: Server-side query and normalization.
- Notes: Free source, uneven completeness possible by location.

### 12.3 Anthropic Haiku API

- Purpose: Match curated ingredients to active offers and rank low-cost meals.
- Constraint: Model is used for mapping and ranking only, not generating new recipes.

---

## 13) Key UX Requirements

1. Mobile-first responsive layout.
2. One-screen access to three core workflows.
3. Minimal text noise, high action density.
4. Clear price and savings prominence.
5. Empty state messaging with useful fallback actions.

---

## 14) Success Metrics (MVP)

### Product Metrics

1. Search success rate (user gets useful result within first query session).
2. Meal card click-through or expansion rate.
3. Return usage (weekly repeat visits).

### Quality Metrics

1. API error rate by source.
2. Meal matching parse success rate.
3. Median response times for search and meals endpoints.

### Cost Metrics

1. Monthly Anthropic spend.
2. Request volumes against free tier limits.

---

## 15) Risks and Mitigations

1. **Upstream API changes**  
   Mitigation: isolate integration in typed adapter modules, log parse failures clearly.

2. **Inconsistent offer naming for matching**  
   Mitigation: ingredient synonym dictionary + strict JSON output validation from Haiku.

3. **Partial opening hours coverage in OSM**  
   Mitigation: show "hours unavailable" fallback, allow manual metadata overlay.

4. **Secret leakage risk**  
   Mitigation: `.gitignore` + `.env.example` template + pre-push checks.

5. **Scope expansion too early**  
   Mitigation: strict MVP boundaries until real usage feedback arrives.

---

## 16) Milestones

### Milestone 1: Foundation
- project scaffolding
- env template
- API client skeletons

### Milestone 2: Search Experience
- working search endpoint
- result UI and sorting

### Milestone 3: Meal Intelligence
- curated recipe dataset
- Haiku matching route
- cheapest meals UI cards

### Milestone 4: Store Guide
- Overpass integration
- store card UI

### Milestone 5: Public Launch
- docs finalized
- deployment configuration
- public repository setup

---

## 17) Acceptance Criteria (MVP Exit)

MVP is accepted when all conditions are true:

1. A user can search items and see Trier store prices sorted cheapest first.
2. A user can see at least 5 cheap meal suggestions based on current offers.
3. A user can view store opening hours/addresses from free source data.
4. App is deployed and accessible publicly.
5. Repository includes complete onboarding docs for new contributors.

---

## 18) Dependencies

1. Active API credentials for Anthropic and Marktguru headers.
2. Stable internet access to upstream APIs.
3. Vercel project setup for deployment.

---

## 19) Open Questions

1. Wasgau integration path for v2: direct source vs aggregator.
2. Preferred cadence for curated recipe updates.
3. Future telemetry choice (privacy-first event logging vs no analytics).

---

## 20) Handoff Notes for New Contributors

If you are not the original author:

1. Read this PRD first.
2. Read `PROJECT_LOG.md` for prior decisions and tradeoffs.
3. Use `docs/IMPLEMENTATION_PLAN.md` for execution order.
4. Never commit secret keys.
