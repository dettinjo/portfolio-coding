// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchAllProjectSlugs } from "@/lib/strapi"; // Your actual API functions

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN;

  // --- FETCH DYNAMIC SLUGS ---
  const projectSlugs = await fetchAllProjectSlugs();

  // --- MAP SLUGS TO SITEMAP ENTRIES ---
  const softwareProjectPages = projectSlugs.map(({ slug }) => ({
    url: `https://${softwareDomain}/${slug}`,
    lastModified: new Date(),
  }));

  // --- DEFINE STATIC AND TOP-LEVEL PAGES ---
  const routes = [
    { url: `https://${softwareDomain}`, priority: 1.0 },
    { url: `https://${softwareDomain}/imprint`, priority: 0.5 },
    { url: `https://${softwareDomain}/privacy_policy`, priority: 0.5 },
  ];

  return [...routes, ...softwareProjectPages];
}
