import "server-only";
import { cache } from "react";

// Re-export types from shared file
export type {
  MediaImage,
  Skill,
  SkillCategory,
  SoftwareProject,
} from "./payload-types-shared";

import type { SoftwareProject, SkillCategory } from "./payload-types-shared";

// Import static JSON data
import projectsData from "@/data/projects.json";
import skillsData from "@/data/skills.json";
import techRegistryData from "@/data/tech-registry.json";

// Type assertions for static imports
const projects = projectsData as unknown as SoftwareProject[];
const skills = skillsData as unknown as SkillCategory[];
const techRegistry = techRegistryData as Record<
  string,
  { name: string; category: string; iconClassName: string | null; url: string | null }
>;

// Fetch functions returning static data
export const fetchSoftwareProjects = cache(async (_locale: string = "en") => {
  return projects;
});

export const fetchSkillCategories = cache(async (_locale: string = "en") => {
  return skills;
});

export const fetchSoftwareProjectBySlug = cache(
  async (slug: string, _locale: string = "en") => {
    const project = projects.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase()
    );
    return project || null;
  }
);

export const fetchAllProjectSlugs = cache(async (_locale: string = "en") => {
  return projects.map((p) => ({ slug: p.slug }));
});

export const getTechDetailsMap = cache(async () => {
  const techDetailsMap: {
    [key: string]: { iconClassName: string | null; url: string | null };
  } = {};

  for (const [key, value] of Object.entries(techRegistry)) {
    techDetailsMap[key.toLowerCase()] = {
      iconClassName: value.iconClassName || null,
      url: value.url || null,
    };
  }

  return techDetailsMap;
});
