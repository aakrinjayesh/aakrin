import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { publicRoutes } from "@/lib/seo/routes";

// Generated once at build time (static export)
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${env.siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
