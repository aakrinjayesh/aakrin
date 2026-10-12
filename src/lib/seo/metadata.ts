import type { Metadata } from "next";
import { site } from "@/content/site";

export const defaultTitle = "Aakrin | Salesforce Engineering & Consulting";

export const defaultDescription =
  "Aakrin is a Salesforce engineering company helping consulting partners extend their delivery, and businesses implement, integrate and optimize Salesforce.";

type PageMetadataInput = {
  /** Page title. Combined with the " | Aakrin" template unless `absoluteTitle` is set. */
  title?: string;
  absoluteTitle?: string;
  description: string;
  /** Path from the site root, e.g. "/services/agentforce". Sets the canonical URL. */
  path: string;
};

/**
 * Per-page metadata: title, description, canonical URL and Open Graph.
 * metadataBase (root layout) turns relative URLs into absolute ones.
 */
export function pageMetadata({
  title,
  absoluteTitle,
  description,
  path,
}: PageMetadataInput): Metadata {
  const ogTitle = absoluteTitle ?? (title ? `${title} | ${site.name}` : defaultTitle);
  return {
    title: absoluteTitle ? { absolute: absoluteTitle } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: "en",
      url: path,
      title: ogTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
    },
  };
}
