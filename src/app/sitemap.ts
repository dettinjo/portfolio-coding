// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchAllProjectSlugs } from "@/lib/payload";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN;

  // --- FETCH DYNAMIC SLUGS FOR BOTH LOCALES ---
  const [enProjectSlugs, deProjectSlugs] = await Promise.all([
    fetchAllProjectSlugs("en"),
    fetchAllProjectSlugs("de"),
  ]);

  // --- MAP SLUGS TO SITEMAP ENTRIES ---
  const enSoftwareProjectPages = enProjectSlugs.map(({ slug }) => ({
    url: `https://${softwareDomain}/${slug}`,
    lastModified: new Date(),
  }));

  const deSoftwareProjectPages = deProjectSlugs.map(({ slug }) => ({
    url: `https://${softwareDomain}/de/${slug}`,
    lastModified: new Date(),
  }));

  // --- DEFINE STATIC AND TOP-LEVEL PAGES FOR BOTH LOCALES ---
  const staticEnRoutes = [
    { url: `https://${softwareDomain}`, priority: 1.0 },
    { url: `https://${softwareDomain}/imprint`, priority: 0.5 },
    { url: `https://${softwareDomain}/privacy_policy`, priority: 0.5 },
  ];

  const staticDeRoutes = [
    { url: `https://${softwareDomain}/de`, priority: 1.0 },
    { url: `https://${softwareDomain}/de/imprint`, priority: 0.5 },
    { url: `https://${softwareDomain}/de/privacy_policy`, priority: 0.5 },
  ];

  return [
    ...staticEnRoutes,
    ...staticDeRoutes,
    ...enSoftwareProjectPages,
    ...deSoftwareProjectPages,
  ];
}
