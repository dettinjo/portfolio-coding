// Shared types for Payload CMS
// This file contains only type definitions and can be safely imported by both client and server components

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
  description: string;
  longDescription?: string; // Markdown string from textarea
  projectType: string;
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
