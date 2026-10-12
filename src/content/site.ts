import type { ImageAsset } from "./types";

// Company identity and contact details, as used on the current live site.

export const site = {
  name: "Aakrin",
  /** Name used in the copyright line on every previous version of the site. */
  companyName: "Aakrin Consulting Services",
  email: "info@aakrin.com",
  calendlyUrl: "https://calendly.com/akshat-shah-aakrin/new-meeting",
  linkedinUrl: "https://www.linkedin.com/company/aakrin",
  whatsapp: {
    display: "+91 72596 88052",
    url: "https://wa.me/917259688052",
  },
  address: {
    streetAddress: "#112, First Floor, Confident Oxygen Mall, Chambenahalli, Sarjapura Road",
    locality: "Bangalore",
    postalCode: "562125",
    countryCode: "IN",
    countryName: "India",
  },
  logo: { src: "/brand/aakrin-logo.svg", width: 464, height: 102 } satisfies ImageAsset,
  logoOnDark: { src: "/brand/aakrin-logo-white.svg", width: 464, height: 102 } satisfies ImageAsset,
} as const;

/** Positioning from docs/01-POSITIONING.md and the approved Stage 1 decisions. */
export const positioning = {
  primary:
    "Aakrin is a Salesforce engineering company that helps Salesforce consulting partners extend their delivery capabilities.",
  secondary: "Aakrin helps businesses implement, integrate, customize and optimize Salesforce.",
} as const;
