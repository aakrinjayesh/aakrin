import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

// Generated once at build time (static export)
export const dynamic = "force-static";

// Crawling is allowed only when ALLOW_INDEXING=true (the production domain).
// Preview and onrender.com deployments disallow everything.
export default function robots(): MetadataRoute.Robots {
  if (!env.allowIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
