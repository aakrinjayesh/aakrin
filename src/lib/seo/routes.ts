import type { MetadataRoute } from "next";

// Public, indexable routes. Add a page here when it ships; the sitemap is built from this list.
// Only publish pages with enough unique content (docs/09-SEO.md).

type SitemapEntry = {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
};

export const publicRoutes: readonly SitemapEntry[] = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
];
