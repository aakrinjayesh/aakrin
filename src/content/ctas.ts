// CTA hierarchy from docs/06-DESIGN-SYSTEM.md and docs/11-CONVERSION.md.
// Labels live here so every placement uses the same wording.

export const ctas = {
  /** Primary: opens Calendly. */
  book: { label: "Book a Salesforce Consultation" },
  /** Secondary: opens the 3-question quiz, which ends in the enquiry form. */
  enquire: { label: "Tell us what you need" },
  /** Contextual links */
  exploreServices: { label: "Explore services", href: "/#services" },
  viewCaseStudies: { label: "View case studies", href: "/#results" },
  exploreExpertise: { label: "Explore Salesforce expertise", href: "/#salesforce" },
} as const;

export type ContextualCtaKey = "exploreServices" | "viewCaseStudies" | "exploreExpertise";
