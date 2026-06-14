// Shared portfolio type definitions — safe to import in both client and server components

// Single source of truth for all personalization. The published template ships
// only config/site.config.example.json; the real values are generated into
// src/data/site.config.json at build time (from the portfolio-config repo or a
// local config fallback). See src/lib/config.ts.
export interface SiteConfig {
  person: {
    fullName: string;
    firstName: string; // derived from fullName when absent
    headline: string;
    email: string;
    phone: string;
    address: { street: string; city: string; country: string };
    socials: {
      github?: string;
      linkedin?: string;
      instagram?: string;
      email?: string;
      x?: string;
      youtube?: string;
      devto?: string;
      stackoverflow?: string;
      [key: string]: string | undefined;
    };
    hasCustomAvatar?: boolean;
  };
  site: {
    serverUrl: string;
    defaultLocale: string;
    locales: string[];
    seo: { description: { en: string; de: string } };
  };
  legal: {
    hosting: { provider: string; address: string };
    analytics: { tool: string; domain: string; cookieless: boolean };
  };
  contact: { smtpFrom: string };
}

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
  categories?: string[]; // tech categories this project spans (for filtering)
  coverImage: MediaImage | null;
  gallery: MediaImage[] | null;
  localizations?: Array<{
    id: number | string;
    slug: string;
    locale: string;
  }>;
}
