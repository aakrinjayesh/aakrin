import type { Fact } from "./types";

// Industries (docs/07-HOMEPAGE.md), shown in this order: the three priority industries first,
// then the rest of the list confirmed by the product owner on 2026-10-12.
// Summaries describe where Salesforce applies; they claim no depth, tenure or outcomes.

export interface Industry extends Fact {
  id: string;
  name: string;
  /** Future /industries/<slug> page (docs/09-SEO.md). */
  slug?: string;
  summary?: string;
}

export const industries: readonly Industry[] = [
  {
    id: "manufacturing",
    name: "Manufacturing",
    slug: "manufacturing",
    summary:
      "Sales, service and partner processes connected to the operational systems behind them.",
    status: "confirmed",
  },
  {
    id: "hi-tech",
    name: "Hi-Tech",
    slug: "hi-tech",
    summary:
      "Sales, customer service and customer data for technology companies and software vendors.",
    status: "confirmed",
  },
  {
    id: "real-estate",
    name: "Real Estate",
    slug: "real-estate",
    summary: "Leads, property sales and client engagement managed in one place.",
    status: "confirmed",
  },
  {
    id: "pharma",
    name: "Pharma & Life Sciences",
    slug: "pharma-life-sciences",
    summary:
      "Engagement with healthcare professionals, field teams and distributors in one connected view.",
    status: "confirmed",
  },
  {
    id: "energy",
    name: "Energy & Utilities",
    slug: "energy-utilities",
    summary:
      "Customer service, field operations and account management for energy and utility providers.",
    status: "confirmed",
  },
  {
    id: "higher-education",
    name: "Higher Education",
    slug: "higher-education",
    summary: "Student recruitment, admissions and student services managed on one platform.",
    status: "confirmed",
  },
  {
    id: "financial-services",
    name: "Financial Services",
    slug: "financial-services",
    summary:
      "Client onboarding, relationship management and service for banks, lenders and insurers.",
    status: "confirmed",
  },
  {
    id: "retail",
    name: "Retail & CPG",
    slug: "retail-cpg",
    summary:
      "Consistent customer experiences across stores, online channels and distribution partners.",
    status: "confirmed",
  },
  {
    id: "healthcare",
    name: "Healthcare",
    slug: "healthcare",
    summary:
      "Patient engagement, care coordination and service connected to the systems around them.",
    status: "confirmed",
  },
  {
    id: "non-profit",
    name: "Non-Profit",
    slug: "non-profit",
    summary: "Donor, volunteer and programme management for non-profit organisations.",
    status: "confirmed",
  },
  {
    id: "recruitment",
    name: "Recruitment",
    slug: "recruitment",
    summary: "Candidates, clients and placements tracked through one connected process.",
    status: "confirmed",
  },
];
