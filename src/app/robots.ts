import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

// Static so it can be emitted under `output: export` (GitHub Pages demo).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const serverUrl = siteConfig.site.serverUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: [`${serverUrl}/sitemap.xml`],
  };
}
