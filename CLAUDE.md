# Aakrin Website — Claude Code Project Instructions

## Role

You are the implementation agent for the Aakrin website.

The `/docs` directory is the product and implementation specification. Treat it as the source of truth for business positioning, UX, design, content architecture, quiz behavior, SEO, analytics, and conversion strategy.

Do not invent business facts.

When a requirement is marked `TBD`, preserve it as a clearly identifiable placeholder or ask for clarification. Never fabricate client results, certifications, statistics, case studies, industries, or capabilities.

## Product positioning

Aakrin is primarily a **Salesforce engineering company that helps Salesforce consulting partners extend their capabilities** across:

- Sales Cloud
- Service Cloud
- Experience Cloud
- Marketing Cloud
- Field Service
- Data Cloud
- Agentforce

Aakrin also helps businesses implement, integrate, customize, and optimize Salesforce.

## Target customers

Primary commercial targets:

- Salesforce consulting partners
- Startups
- SMBs
- Mid-market businesses
- Businesses with 100+ employees

Typical buyer/stakeholder roles:

- Founder / CEO
- CTO
- CIO
- COO
- Head of Sales
- Head of Operations
- Salesforce Admin

Geography: Global.

## Brand personality

The website should feel:

1. AI-forward
2. Salesforce-specialist
3. Startup-like

Avoid generic corporate Salesforce-partner aesthetics.

## Technical direction

Recommended production stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui where useful

Prefer reusable, composable components.

Do not introduce additional UI frameworks unless necessary and explicitly justified.

## Implementation principles

1. Inspect the existing repository before changing architecture.
2. Reuse good existing components where practical.
3. Keep business data separate from presentation components.
4. Build reusable sections and cards.
5. Keep public content SEO-friendly and server-renderable.
6. Make accessibility a first-class requirement.
7. Keep mobile behavior intentional, not merely responsive by accident.
8. Preserve analytics hooks when refactoring.
9. Do not remove functionality without documenting why.
10. Do not create fake testimonials, metrics, logos, certifications, case studies, or client outcomes.
11. Do not replace approved copy with generic marketing language.
12. If two specifications conflict, stop and report the conflict instead of silently choosing.
13. Before considering a feature complete, test desktop, tablet, and mobile layouts.
14. Run lint/type/build checks after significant changes.

## Specification map

Read the relevant document before implementing the corresponding area:

- `01-POSITIONING.md` — business positioning and messaging
- `02-AUDIENCE.md` — target users and buyer intent
- `03-SERVICES.md` — service architecture
- `04-SALESFORCE-EXPERTISE.md` — Salesforce capability architecture
- `05-INFORMATION-ARCHITECTURE.md` — site/page hierarchy
- `06-DESIGN-SYSTEM.md` — visual system and interaction rules
- `07-HOMEPAGE.md` — homepage structure and content
- `08-QUIZ.md` — three-question lead qualification quiz
- `09-SEO.md` — technical and content SEO requirements
- `10-ANALYTICS.md` — event and conversion tracking
- `11-CONVERSION.md` — CTA and lead-generation strategy
- `12-IMPLEMENTATION-PLAN.md` — implementation sequence

## Important current-project context

The existing homepage contains an onboarding quiz, problem-oriented service cards, Salesforce credibility stats, client logos, a case study, industries, process, blog, contact form, Calendly, WhatsApp, Apollo tracking, and planned Microsoft Clarity tracking.

The first-visit quiz auto-open and the current mailto enquiry fallback are known implementation details that are subject to redesign. The existing Clarity code being commented out is intentional during the current development stage and must not be treated as a defect requiring immediate activation.

## Working mode

Before large implementation work:

1. Read the relevant specification files.
2. Inspect the current codebase.
3. Summarize the implementation approach.
4. Identify conflicts/TBD items.
5. Implement in small, reviewable stages.

Do not attempt to redesign the entire website in one uncontrolled pass.

## Next.js version notes

@AGENTS.md
