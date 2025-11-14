// portfolio-frontend/src/lib/strapi.ts
import qs from "qs";
import { cache } from "react";

// --- Interfaces remain the same ---
interface StrapiImage {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  size: number | null;
}
interface StrapiResponseWrapper<T> {
  data: T;
}
export interface Skill {
  id: number;
  name: string;
  iconClassName: string;
  level: number;
  url: string;
  svgIcon?: {
    url: string;
    alternativeText?: string;
  };
}
export interface SkillCategory {
  id: number;
  name: string;
  order: number;
  skills: Skill[];
}
export interface SoftwareProject {
  id: number;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  projectType: string;
  developedAt?: string;
  liveUrl?: string;
  repoUrl?: string;
  tags: string[];
  coverImage: StrapiImage | null;
  gallery: StrapiImage[] | null;
  localizations?: Array<{
    id: number;
    slug: string;
    locale: string;
  }>;
}

const STRAPI_URL =
  process.env.NEXT_PUBLIC_STRAPI_API_URL || "http://localhost:1337";

export function getStrapiMedia(url: string | undefined | null): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith("http")) {
    return url;
  }
  return `${STRAPI_URL}${url}`;
}

async function fetchAPI<T>(
  path: string,
  urlParamsObject = {},
  options = {},
  locale?: string
): Promise<T> {
  try {
    const mergedOptions = {
      headers: { "Content-Type": "application/json" },
      ...options,
    };

    const paramsWithLocale = { ...urlParamsObject, locale };

    const queryString = qs.stringify(paramsWithLocale, {
      encodeValuesOnly: true,
    });
    const requestUrl = `${STRAPI_URL}/api${path}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await fetch(requestUrl, mergedOptions);
    if (!response.ok) {
      console.error(
        `Error fetching ${requestUrl}: ${response.status} ${response.statusText}`
      );
      throw new Error(`An error occurred please try again`);
    }
    const jsonData = await response.json();
    return (jsonData as StrapiResponseWrapper<T>).data || jsonData;
  } catch (error) {
    console.error(error);
    throw new Error(`An error occurred please try again`);
  }
}

export const getTechDetailsMap = cache(async () => {
  const allSkills = await fetchAPI<Skill[]>("/skills", {
    fields: ["name", "iconClassName", "url"],
    pagination: { pageSize: 250 },
  });
  const techDetailsMap: {
    [key: string]: { iconClassName: string | null; url: string | null };
  } = {};

  if (Array.isArray(allSkills)) {
    for (const skill of allSkills) {
      if (skill.name) {
        techDetailsMap[skill.name.toLowerCase()] = {
          iconClassName: skill.iconClassName || null,
          url: skill.url || null,
        };
      }
    }
  }
  return techDetailsMap;
});

export async function fetchSkillCategories(
  locale?: string
): Promise<SkillCategory[]> {
  return fetchAPI<SkillCategory[]>(
    "/skill-categories",
    {
      populate: {
        skills: {
          populate: {
            svgIcon: {
              fields: ["url", "alternativeText"],
            },
          },
        },
      },
      sort: "order:asc",
    },
    {},
    locale
  );
}

export async function fetchSoftwareProjects(
  locale?: string
): Promise<SoftwareProject[]> {
  return fetchAPI<SoftwareProject[]>(
    "/software-projects",
    {
      populate: {
        coverImage: {
          fields: ["url", "alternativeText", "width", "height", "size"],
        },
        gallery: true,
      },
      sort: "developedAt:desc",
    },
    {},
    locale
  );
}

export async function fetchSoftwareProjectBySlug(
  slug: string,
  locale?: string
): Promise<SoftwareProject | null> {
  const projects = await fetchAPI<SoftwareProject[]>(
    "/software-projects",
    {
      filters: { slug: { $eq: slug } },
      fields: ["*"],
      populate: {
        coverImage: {
          fields: ["url", "alternativeText", "width", "height", "size"],
        },
        gallery: {
          fields: ["url", "alternativeText", "width", "height", "size"],
        },
        localizations: true,
      },
    },
    {},
    locale
  );
  return projects?.[0] || null;
}

export async function fetchAllProjectSlugs(
  locale?: string
): Promise<{ slug: string }[]> {
  const projects = await fetchAPI<{ slug: string }[]>(
    "/software-projects",
    { fields: ["slug"] },
    {},
    locale
  );
  return projects.map((p) => ({ slug: p.slug }));
}

export async function fetchSkills(locale?: string): Promise<SkillCategory[]> {
  return fetchAPI<SkillCategory[]>(
    "/skill-categories",
    {
      populate: { skills: true },
      sort: "order:asc",
    },
    {},
    locale
  );
}
