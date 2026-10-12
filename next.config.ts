import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes the whole site to `out/`, served by a Render Static Site
  // (render.yaml). Every page is prerendered and the enquiry form posts from the browser, so no
  // server is needed.
  output: "export",
  // A static host can't resize images on request; logos are served as they are
  images: { unoptimized: true },
};

export default nextConfig;
