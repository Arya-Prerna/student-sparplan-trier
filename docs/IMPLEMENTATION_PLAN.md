# Implementation Plan

## Project

Student Sparplan Trier

## Objective

Build and launch a student-focused grocery savings web app for Trier with:

1. Deal search
2. Cheapest meals this week
3. Store hours guide

All while keeping costs near zero.

---

## Phase 0: Documentation and Repository Setup

1. Create `PRD.md` for full product specification.
2. Create `PROJECT_LOG.md` for decisions and execution traceability.
3. Initialize git repository.
4. Push to a public GitHub repository.
5. Configure secret-safe environment setup (`.env.example`, `.gitignore`).

---

## Phase 1: Project Scaffold

1. Initialize Next.js 15 app.
2. Add Tailwind CSS.
3. Create base layout and route skeleton.
4. Add typed models:
   - `Deal`
   - `Recipe`
   - `Store`
   - `MealSuggestion`

---

## Phase 2: Data Integrations

1. Add Marktguru proxy route for deal search.
2. Add Overpass route for store metadata and opening hours.
3. Add recipe dataset (`data/recipes.json`) with curated recipes only.
4. Add Haiku matching route (no recipe generation).

---

## Phase 3: Core UI

1. Build single-page app with three tabs:
   - Deal Search
   - Cheapest Meals This Week
   - Store Guide
2. Optimize mobile-first layout.
3. Add loading, empty, and error states.

---

## Phase 4: Hardening

1. Add response schema validation.
2. Add cache strategy and fallback handling.
3. Add basic tests for parsers and matchers.
4. Add deployment validation checklist.

---

## Phase 5: Launch

1. Deploy to Vercel.
2. Configure environment variables in Vercel.
3. Verify public URL behavior.
4. Share with first test users and collect feedback.

---

## Security Rules

1. Never commit secrets.
2. Keep live keys in `.env.local` and deployment secrets.
3. Keep `.env.example` as placeholders only.

---

## Definition of Done (MVP)

MVP is done when:

1. User can search products and compare current prices.
2. User can view at least 5 cheap meal suggestions based on active offers.
3. User can see store hours and addresses in Trier.
4. Docs are complete for external contributors.
5. Repository is public and reproducible.
