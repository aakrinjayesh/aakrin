import type { Fact } from "./types";

// Services answer "what can Aakrin do for me?" (docs/03-SERVICES.md).
// Kept separate from Salesforce platforms (docs/04-SALESFORCE-EXPERTISE.md).

export interface Service extends Fact {
  id: string;
  title: string;
  /** Future dedicated page (docs/03, docs/09). Pages are not built yet. */
  slug?: string;
}

export const services: readonly Service[] = [
  {
    id: "consulting",
    title: "Salesforce Consulting",
    slug: "salesforce-consulting",
    status: "confirmed",
  },
  {
    id: "implementation",
    title: "Salesforce Implementation",
    slug: "salesforce-implementation",
    status: "confirmed",
  },
  { id: "customization", title: "Salesforce Customization", status: "confirmed" },
  {
    id: "development",
    title: "Salesforce Development",
    slug: "salesforce-development",
    status: "confirmed",
  },
  {
    id: "integration",
    title: "Salesforce Integration",
    slug: "salesforce-integration",
    status: "confirmed",
  },
  { id: "data-migration", title: "Data Migration", slug: "data-migration", status: "confirmed" },
  {
    id: "automation",
    title: "Process Automation",
    status: "confirmed",
    note: "Salesforce business-process automation only (Stage 2 brief, lifecycle stage 'Automate'). Not generic automation.",
  },
  { id: "optimization", title: "Salesforce Optimization", status: "confirmed" },
  {
    id: "support",
    title: "Salesforce Support & Maintenance",
    slug: "salesforce-support",
    status: "confirmed",
  },
  { id: "lightning-migration", title: "Lightning Migration", status: "confirmed" },
  {
    id: "appexchange",
    title: "AppExchange Development",
    status: "confirmed",
    note: "Spec: 'AppExchange-related development/services'; exact packaging TBD.",
  },
  {
    id: "agentforce",
    title: "Agentforce & AI",
    slug: "agentforce",
    status: "confirmed",
    note: "Capability is confirmed; specific delivered Agentforce work is not. Do not claim projects.",
  },
  {
    id: "data-cloud",
    title: "Data Cloud Services",
    slug: "data-cloud",
    status: "confirmed",
    note: "Capability is confirmed; specific delivered Data Cloud work is not. Do not claim projects.",
  },
];

export interface LifecycleStage {
  id: string;
  label: string;
  summary: string;
  serviceIds: readonly string[];
}

/**
 * Services lifecycle (approved decision 17): Consult → Implement → Integrate → Customize →
 * Automate → Optimize → Support. Distinct from the "How we work" engagement process.
 */
export const lifecycleStages: readonly LifecycleStage[] = [
  {
    id: "consult",
    label: "Consult",
    summary: "Assess your org, processes and goals, and shape the right Salesforce approach.",
    serviceIds: ["consulting"],
  },
  {
    id: "implement",
    label: "Implement",
    summary: "Set Salesforce up, move data across and modernize existing orgs.",
    serviceIds: ["implementation", "data-migration", "lightning-migration"],
  },
  {
    id: "integrate",
    label: "Integrate",
    summary: "Connect Salesforce with the systems around it and bring customer data together.",
    serviceIds: ["integration", "data-cloud"],
  },
  {
    id: "customize",
    label: "Customize",
    summary: "Extend Salesforce with custom development where configuration isn't enough.",
    serviceIds: ["customization", "development", "appexchange"],
  },
  {
    id: "automate",
    label: "Automate",
    summary:
      "Automate business processes within Salesforce, and apply Agentforce and AI to real workflows.",
    serviceIds: ["automation", "agentforce"],
  },
  {
    id: "optimize",
    label: "Optimize",
    summary: "Improve the performance, usability and adoption of an existing org.",
    serviceIds: ["optimization"],
  },
  {
    id: "support",
    label: "Support",
    summary: "Keep Salesforce maintained and evolving as the business changes.",
    serviceIds: ["support"],
  },
];

export interface ProcessStep {
  label: string;
  summary: string;
}

/** Engagement process (approved decision 17). Distinct from the services lifecycle. */
export const howWeWork: readonly ProcessStep[] = [
  { label: "Discover", summary: "Understand your current org, processes, systems and goals." },
  {
    label: "Plan",
    summary: "Agree scope, architecture and delivery approach before build starts.",
  },
  {
    label: "Build",
    summary: "Configure, develop and integrate, with work reviewed as it progresses.",
  },
  { label: "Launch", summary: "Test with your users, deploy and hand over." },
  { label: "Optimize", summary: "Refine and extend Salesforce as your needs change." },
];
