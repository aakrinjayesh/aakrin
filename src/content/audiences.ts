// Audience paths from docs/02-AUDIENCE.md, docs/07-HOMEPAGE.md and the Stage 2 brief.
// Consulting partners are the primary audience.

export type AudienceId = "partner" | "business";

export interface Audience {
  id: AudienceId;
  label: string;
  title: string;
  summary: string;
  themes: readonly string[];
}

export const audiences: readonly Audience[] = [
  {
    id: "partner",
    label: "Salesforce consulting partners",
    title: "Extend your Salesforce delivery capacity",
    summary:
      "Engineering support across implementation, customization, integration, development and specialized Salesforce capabilities.",
    themes: [
      "Extend your delivery team",
      "Add specialist engineering capability",
      "Handle complex Salesforce work",
      "Add Agentforce, data and integration expertise",
      "Scale delivery without permanent hiring",
    ],
  },
  {
    id: "business",
    label: "Businesses",
    title: "Make Salesforce work for your business",
    summary:
      "Implement, integrate, customize and optimize Salesforce with an engineering partner that works across the Salesforce ecosystem.",
    themes: [
      "Implement Salesforce",
      "Fix or improve an existing org",
      "Integrate systems and migrate data",
      "Customize and automate",
      "Add AI and Agentforce",
      "Get ongoing support",
    ],
  },
];
