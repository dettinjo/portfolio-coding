// src/app/sitemap.ts
import { MetadataRoute } from "next";
import { fetchAllProjectSlugs } from "@/lib/payload";

export const dynamic = "force-dynamic";

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
  // --- DEFINE STATIC AND TOP-LEVEL PAGES FOR BOTH LOCALES ---
  // --- DEFINE STATIC AND TOP-LEVEL PAGES FOR BOTH LOCALES ---
  const staticEnRoutes = [
    {
      url: `${serverUrl}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
      alternates: {
        languages: {
          en: `${serverUrl}`,
          de: `${serverUrl}/de`,
        },
      },
    },
    {
      url: `${serverUrl}/imprint`,
      lastModified: new Date(),
      priority: 0.5,
      alternates: {
        languages: {
          en: `${serverUrl}/imprint`,
          de: `${serverUrl}/de/imprint`,
        },
      },
    },
    {
      url: `${serverUrl}/privacy_policy`,
      lastModified: new Date(),
      priority: 0.5,
      alternates: {
        languages: {
          en: `${serverUrl}/privacy_policy`,
          de: `${serverUrl}/de/privacy_policy`,
        },
      },
    },
    {
      url: `${serverUrl}/resume`,
      lastModified: new Date(),
      priority: 0.8,
      alternates: {
        languages: {
          en: `${serverUrl}/resume`,
          de: `${serverUrl}/de/resume`,
        },
      },
    },
  ];

  const staticDeRoutes = [
    {
      url: `${serverUrl}/de`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
      alternates: {
        languages: {
          en: `${serverUrl}`,
          de: `${serverUrl}/de`,
        },
      },
    },
    {
      url: `${serverUrl}/de/imprint`,
      lastModified: new Date(),
      priority: 0.5,
      alternates: {
        languages: {
          en: `${serverUrl}/imprint`,
          de: `${serverUrl}/de/imprint`,
        },
      },
    },
    {
      url: `${serverUrl}/de/privacy_policy`,
      lastModified: new Date(),
      priority: 0.5,
      alternates: {
        languages: {
          en: `${serverUrl}/privacy_policy`,
          de: `${serverUrl}/de/privacy_policy`,
        },
      },
    },
    {
      url: `${serverUrl}/de/resume`,
      lastModified: new Date(),
      priority: 0.8,
      alternates: {
        languages: {
          en: `${serverUrl}/resume`,
          de: `${serverUrl}/de/resume`,
        },
      },
    },
  ];

  return [
    ...staticEnRoutes,
    ...staticDeRoutes,
    ...enSoftwareProjectPages,
    ...deSoftwareProjectPages,
  ];
}
