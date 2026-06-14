// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchAllProjectSlugs } from "@/lib/data";
import { siteConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";

// Static so it can be emitted under `output: export` (GitHub Pages demo).
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const serverUrl = siteConfig.site.serverUrl;

  // Fetch dynamic slugs for all configured locales
  const projectSlugsPerLocale: Record<string, { slug: string }[]> = {};
  for (const locale of routing.locales) {
    try {
      projectSlugsPerLocale[locale] = await fetchAllProjectSlugs(locale);
    } catch (error) {
      console.warn(
        `Database not available or empty, skipping sitemap generation for projects in locale "${locale}".`,
        error
      );
      projectSlugsPerLocale[locale] = [];
    }
  }

  // Helper to build a localized path
  const getLocalizedUrl = (path: string, locale: string) => {
    if (locale === routing.defaultLocale) {
      return path ? `${serverUrl}/${path}` : `${serverUrl}`;
    }
    return path ? `${serverUrl}/${locale}/${path}` : `${serverUrl}/${locale}`;
  };

  const staticRoutePaths = ["", "imprint", "privacy_policy", "resume"];
  const priorities: Record<string, number> = {
    "": 1.0,
    resume: 0.8,
    imprint: 0.5,
    privacy_policy: 0.5,
  };

  // Generate static routes dynamically for all locales
  const staticRoutes: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    for (const path of staticRoutePaths) {
      const isHome = path === "";
      staticRoutes.push({
        url: getLocalizedUrl(path, locale),
        lastModified: new Date(),
        changeFrequency: isHome ? ("weekly" as const) : undefined,
        priority: priorities[path] ?? 0.5,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [loc, getLocalizedUrl(path, loc)])
          ),
        },
      });
    }
  }

  // Generate dynamic project pages dynamically for all locales
  const projectPages: MetadataRoute.Sitemap = [];
  for (const locale of routing.locales) {
    const slugs = projectSlugsPerLocale[locale] || [];
    for (const { slug } of slugs) {
      projectPages.push({
        url: getLocalizedUrl(slug, locale),
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((loc) => [loc, getLocalizedUrl(slug, loc)])
          ),
        },
      });
    }
  }

  return [...staticRoutes, ...projectPages];
}
