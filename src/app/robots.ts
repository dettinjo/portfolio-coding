import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";

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
