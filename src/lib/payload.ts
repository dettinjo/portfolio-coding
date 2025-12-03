import "server-only";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { cache } from "react";

// Helper to get Payload client
export const getPayloadClient = async () => {
  return await getPayload({ config: configPromise });
};

// Re-export types from shared file
export type {
  MediaImage,
  Skill,
  SkillCategory,
  SoftwareProject,
} from "./payload-types-shared";

// Import types for internal use
import type { SoftwareProject, SkillCategory } from "./payload-types-shared";

// Fetch functions matching the Strapi interface

export const fetchSoftwareProjects = cache(async (locale: string = "en") => {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "software-projects",
      locale: locale as "en" | "de" | undefined,
      depth: 2,
      sort: "-developedAt",
    });
    return docs as unknown as SoftwareProject[];
  } catch (error) {
    console.error("Error fetching software projects:", error);
    return [];
  }
});

export const fetchSkillCategories = cache(async (locale: string = "en") => {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "skill-categories",
      locale: locale as "en" | "de" | undefined,
      depth: 2,
      sort: "order",
    });
    return docs as unknown as SkillCategory[];
  } catch (error) {
    console.error("Error fetching skill categories:", error);
    return [];
  }
});

export const fetchSoftwareProjectBySlug = cache(
  async (slug: string, locale: string = "en") => {
    try {
      const payload = await getPayloadClient();
      const { docs } = await payload.find({
        collection: "software-projects",
        where: {
          slug: {
            equals: slug,
          },
        },
        locale: locale as "en" | "de" | undefined,
        depth: 2,
      });
      let project = (docs[0] as unknown as SoftwareProject) || null;

      if (!project && locale !== "en") {
        // Fallback: Try to find the project by slug in the default locale (en)
        // This handles cases where the slug is not localized or missing in the requested locale
        // but Payload falls back to English when reading.
        const { docs: fallbackDocs } = await payload.find({
          collection: "software-projects",
          where: {
            slug: {
              equals: slug,
            },
          },
          locale: "en",
          depth: 0, // We only need the ID
        });

        if (fallbackDocs.length > 0) {
          const { id } = fallbackDocs[0];
          const localizedDoc = await payload.findByID({
            collection: "software-projects",
            id,
            locale: locale as "en" | "de",
            depth: 2,
          });
          project = localizedDoc as unknown as SoftwareProject;
        }
      }

      if (project) {
        // Fetch slugs for all locales to populate localizations
        const { id } = docs[0];
        const localizedDoc = await payload.findByID({
          collection: "software-projects",
          id,
          locale: "all",
        });

        const slugs = localizedDoc.slug as Record<string, string>;

        project.localizations = Object.entries(slugs).map(([loc, slug]) => ({
          id: id as string,
          slug,
          locale: loc,
        }));
      }

      return project;
    } catch (error) {
      console.error(`Error fetching project by slug "${slug}":`, error);
      return null;
    }
  }
);

export const fetchAllProjectSlugs = cache(async (locale: string = "en") => {
  try {
    const payload = await getPayloadClient();
    const { docs } = await payload.find({
      collection: "software-projects",
      locale: locale as "en" | "de" | undefined,
      depth: 0,
      select: {
        slug: true,
      },
    });
    return docs.map((doc) => ({ slug: doc.slug }));
  } catch (error) {
    console.error("Error fetching project slugs:", error);
    return [];
  }
});

export const getTechDetailsMap = cache(async () => {
  try {
    const payload = await getPayloadClient();
    const { docs: allSkills } = await payload.find({
      collection: "skills",
      pagination: false,
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
  } catch (error) {
    console.error("Error fetching tech details map:", error);
    return {};
  }
});
