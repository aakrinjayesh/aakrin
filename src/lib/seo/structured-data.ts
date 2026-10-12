import { platforms } from "@/content/platforms";
import { site } from "@/content/site";
import { confirmed } from "@/content/types";
import { env } from "@/lib/env";
import { defaultDescription } from "./metadata";

/**
 * Organization + ProfessionalService for the whole site (docs/09-SEO.md).
 * Built from confirmed content only. No review or rating markup, by design.
 */
export function organizationJsonLd() {
  const url = `${env.siteUrl}/`;
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${url}#organization`,
    name: site.name,
    alternateName: site.companyName,
    url,
    logo: `${env.siteUrl}${site.logo.src}`,
    email: site.email,
    description: defaultDescription,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.streetAddress,
      addressLocality: site.address.locality,
      postalCode: site.address.postalCode,
      addressCountry: site.address.countryCode,
    },
    areaServed: "Worldwide",
    knowsAbout: [
      "Salesforce",
      ...confirmed(platforms).map((platform) => `Salesforce ${platform.name}`),
    ],
    sameAs: [site.linkedinUrl],
  };
}
