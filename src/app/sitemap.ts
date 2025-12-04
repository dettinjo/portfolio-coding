// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchAllProjectSlugs } from "@/lib/payload";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  // --- FETCH DYNAMIC SLUGS FOR BOTH LOCALES ---
  let enProjectSlugs: { slug: string }[] = [];
  let deProjectSlugs: { slug: string }[] = [];

  try {
    const results = await Promise.all([
      fetchAllProjectSlugs("en"),
      fetchAllProjectSlugs("de"),
    ]);
    enProjectSlugs = results[0] as { slug: string }[];
    deProjectSlugs = results[1] as { slug: string }[];
  } catch (error) {
    console.warn(
      "Database not available or empty, skipping sitemap generation for projects.",
      error
    );
  }

  // --- MAP SLUGS TO SITEMAP ENTRIES ---
  const enSoftwareProjectPages = enProjectSlugs.map(({ slug }) => ({
    url: `${serverUrl}/${slug}`,
    lastModified: new Date(),
  }));

  const deSoftwareProjectPages = deProjectSlugs.map(({ slug }) => ({
    url: `${serverUrl}/de/${slug}`,
    lastModified: new Date(),
  }));

  // --- DEFINE STATIC AND TOP-LEVEL PAGES FOR BOTH LOCALES ---
  const staticEnRoutes = [
    { url: `${serverUrl}`, priority: 1.0 },
    { url: `${serverUrl}/imprint`, priority: 0.5 },
    { url: `${serverUrl}/privacy_policy`, priority: 0.5 },
  ];

  const staticDeRoutes = [
    { url: `${serverUrl}/de`, priority: 1.0 },
    { url: `${serverUrl}/de/imprint`, priority: 0.5 },
    { url: `${serverUrl}/de/privacy_policy`, priority: 0.5 },
  ];

  return [
    ...staticEnRoutes,
    ...staticDeRoutes,
    ...enSoftwareProjectPages,
    ...deSoftwareProjectPages,
  ];
}
