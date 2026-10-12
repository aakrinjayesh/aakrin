# Aakrin — Implementation Plan

## Phase 0 — Repository inspection

Claude must first:

1. Inspect current project structure.
2. Identify framework and build system.
3. Inspect existing routing.
4. Inspect current styling system.
5. Identify reusable components.
6. Identify existing analytics integrations.
7. Identify existing form/Calendly/WhatsApp integrations.
8. Report conflicts with this specification.

Do not rewrite everything immediately.

## Phase 1 — Foundation

Implement or establish:

- Next.js architecture if migration is approved
- TypeScript
- Tailwind
- component structure
- design tokens
- typography
- layout primitives
- header/footer
- analytics abstraction
- SEO metadata foundation

## Phase 2 — Homepage

Build in this conceptual order:

1. Header
2. Hero
3. Audience split
4. Trust
5. Services
6. Salesforce expertise
7. Why Aakrin
8. Industries
9. Results
10. Process
11. Quiz
12. Final CTA
13. Footer

## Phase 3 — Quiz

Implement the three-question qualification flow from `08-QUIZ.md`.

Do not auto-open it.

Reuse the enquiry form for the final step.

## Phase 4 — SEO foundation

Implement:

- metadata
- canonical
- sitemap
- robots
- structured data
- semantic heading hierarchy
- internal links

## Phase 5 — Analytics

Implement event abstraction and the events defined in `10-ANALYTICS.md`.

## Phase 6 — Secondary pages

After homepage approval:

- Services
- Salesforce expertise
- Industries
- Results/case studies
- About
- Insights

Do not generate dozens of thin pages just to increase URL count.

## Phase 7 — Conversion infrastructure

Replace the planned mailto-only fallback with a proper backend/CRM workflow when the final form backend is available.

## Phase 8 — QA

Before launch:

- desktop QA
- mobile QA
- accessibility
- performance
- SEO
- broken links
- form validation
- quiz flows
- analytics events
- metadata
- sitemap
- structured data
- browser testing

## Definition of done

A feature is not complete merely because it renders.

It must:

- match the specification
- work responsively
- be accessible
- preserve SEO
- preserve analytics
- avoid unsupported business claims
- pass relevant tests/build/lint
