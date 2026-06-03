// Shared portfolio type definitions — safe to import in both client and server components

export interface MediaImage {
  id: number | string;
  url: string;
  alternativeText: string | null;
  width: number;
  height: number;
  size: number | null;
}

export interface Skill {
  id: number | string;
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
  id: number | string;
  name: string;
  order: number;
  skills: Skill[];
}

export interface SoftwareProject {
  id: number | string;
  slug: string;
  title: string;
  titleDe?: string;
  description: string;
  descriptionDe?: string;
  longDescription?: string; // Markdown string from textarea
  longDescriptionDe?: string; // German long description (falls back to longDescription if absent)
  projectType: string;
  projectTypeDe?: string;
  developedAt?: string;
  liveUrl?: string;
  repoUrl?: string;
  tags: string[];
  coverImage: MediaImage | null;
  gallery: MediaImage[] | null;
  localizations?: Array<{
    id: number | string;
    slug: string;
    locale: string;
  }>;
}
