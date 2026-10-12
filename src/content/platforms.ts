import type { Fact } from "./types";

// Salesforce clouds/platforms: where Aakrin applies its services (docs/04-SALESFORCE-EXPERTISE.md).
// Summaries describe what each Salesforce product covers; they make no claims about Aakrin's projects.

export type PlatformGroup = "customer" | "data-ai";

export interface Platform extends Fact {
  id: string;
  name: string;
  /** Future /salesforce/<slug> page (docs/09-SEO.md). Pages are not built yet. */
  slug: string;
  group: PlatformGroup;
  summary: string;
}

export const platformGroups: Record<PlatformGroup, string> = {
  customer: "Customer clouds",
  "data-ai": "Data & AI",
};

export const platforms: readonly Platform[] = [
  {
    id: "sales-cloud",
    name: "Sales Cloud",
    slug: "sales-cloud",
    group: "customer",
    summary: "Leads, opportunities, forecasting and the sales process.",
    status: "confirmed",
  },
  {
    id: "service-cloud",
    name: "Service Cloud",
    slug: "service-cloud",
    group: "customer",
    summary: "Case management, service channels and support operations.",
    status: "confirmed",
  },
  {
    id: "experience-cloud",
    name: "Experience Cloud",
    slug: "experience-cloud",
    group: "customer",
    summary: "Portals and sites for customers, partners and communities.",
    status: "confirmed",
  },
  {
    id: "marketing-cloud",
    name: "Marketing Cloud",
    slug: "marketing-cloud",
    group: "customer",
    summary: "Customer journeys, campaigns and marketing engagement.",
    status: "confirmed",
  },
  {
    id: "field-service",
    name: "Field Service",
    slug: "field-service",
    group: "customer",
    summary: "Scheduling, dispatch and work carried out in the field.",
    status: "confirmed",
  },
  {
    id: "data-cloud",
    name: "Data Cloud",
    slug: "data-cloud",
    group: "data-ai",
    summary: "Customer data unified across systems, ready for analytics and AI.",
    status: "confirmed",
  },
  {
    id: "agentforce",
    name: "Agentforce",
    slug: "agentforce",
    group: "data-ai",
    summary: "AI agents that work with Salesforce data and business processes.",
    status: "confirmed",
  },
];
