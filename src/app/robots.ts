import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN || "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: [`https://${softwareDomain}/sitemap.xml`],
  };
}
