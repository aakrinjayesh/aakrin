// Homepage copy (docs/07-HOMEPAGE.md and the Stage 2 brief).
// Facts (logos, platforms, services, industries, proof) come from their own content files.
// Nothing here may state numbers, certifications, partnerships or outcomes.

export interface SectionCopy {
  eyebrow: string;
  title: string;
  description?: string;
}

export const hero = {
  eyebrow: "Salesforce engineering company",
  title: "Salesforce engineering that extends what your team can deliver",
  lede: "Aakrin works with Salesforce consulting partners as an extension of their delivery team, and helps businesses implement, integrate, customize and optimize Salesforce.",
  map: {
    label: "Capability map",
    platforms: "Platforms",
    lifecycle: "Lifecycle",
    audiences: "Works with",
  },
} as const;

export const audienceSection: SectionCopy = {
  eyebrow: "Who we work with",
  title: "Two ways to work with Aakrin",
};

export const trustSection = {
  title: "Clients we've worked with",
} as const;

export const servicesSection: SectionCopy = {
  eyebrow: "Services",
  title: "Salesforce engineering across the full lifecycle",
  description:
    "Aakrin covers the full Salesforce service lifecycle, from consulting and implementation to integration, development and ongoing support. Bring us in for one stage or the whole journey.",
};

export const expertiseSection: SectionCopy = {
  eyebrow: "Salesforce expertise",
  title: "The Salesforce ecosystem we work across",
  description:
    "Our services apply across Salesforce's major clouds, from core CRM to Data Cloud and Agentforce.",
};

export const whySection: SectionCopy = {
  eyebrow: "Why Aakrin",
  title: "Engineering depth for Salesforce delivery",
  description:
    "Aakrin is more than a Salesforce implementation shop. We bring engineering depth to Salesforce work, whether we're extending a partner's team or delivering for a business directly.",
};

export interface Differentiator {
  title: string;
  summary: string;
}

export const differentiators: readonly Differentiator[] = [
  {
    title: "Engineering-first delivery",
    summary:
      "Salesforce work approached as engineering: data models, integrations and custom code, not configuration alone.",
  },
  {
    title: "Flexible capacity for partners",
    summary:
      "Consulting partners can add Salesforce engineering capacity to their projects without building every specialist skill in-house.",
  },
  {
    title: "Alongside your existing team",
    summary:
      "We work within existing teams and delivery processes, alongside your consultants, admins and developers.",
  },
  {
    title: "Integration and data engineering",
    summary:
      "Connecting Salesforce with the systems around it, and handling data migration and unification.",
  },
  {
    title: "Custom Salesforce development",
    summary:
      "Custom functionality built on the platform when standard features don't fit the process.",
  },
  {
    title: "Agentforce and AI",
    summary:
      "Agentforce and AI capability within the same engineering team, connected to your data and processes.",
  },
];

export const industriesSection: SectionCopy = {
  eyebrow: "Industries",
  title: "Where Salesforce engineering meets industry context",
  description: "Salesforce engineering shaped around the way your industry operates.",
};

export const resultsSection: SectionCopy = {
  eyebrow: "Results",
  title: "Salesforce work and its outcomes",
};

export const howWeWorkSection: SectionCopy = {
  eyebrow: "How we work",
  title: "A clear path from discovery to launch",
  description: "Engagements follow five steps, scaled to the size of the work.",
};

/** The enquiry form on the homepage: the same form as the quiz's last step. */
export const enquirySection = {
  eyebrow: "Get in touch",
  title: "Tell us about your Salesforce work",
  description:
    "Share a few details and what you need help with. The Aakrin team will review it and get back to you.",
  emailPrompt: "Prefer email?",
  sendAnother: "Send another enquiry",
} as const;

/** Entry point for the qualification quiz. Renders only when the quiz feature is on. */
export const qualificationSection = {
  eyebrow: "Not sure where to start?",
  title: "Tell us what you need in three short steps",
  description:
    "Your answers are sent to the Aakrin team with your enquiry, so the conversation starts from your context.",
  steps: ["Your challenge", "Help needed", "Your details"],
} as const;

export const finalCtaSection = {
  title: "Let's talk about your Salesforce delivery",
  description:
    "Whether you're extending a consulting team or improving your own Salesforce org, start with a conversation.",
} as const;
