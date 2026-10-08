export type BannerTheme = "dark" | "light";

export type BannerTemplateId =
  | "terminal"        // Terminal Minimalist with prompt (> Title █)
  | "terminal-clean"  // Terminal Minimalist without prompt (Title █)
  | "title-only"      // Title only (vertically centered)
  | "split"           // Architectural Split
  | "glow"            // Ambient Tech Glow
  | "framed";         // Framed Card

export interface BannerData {
  jobTitle: string;
  name: string;
  tagline: string;
  skills: string[];
  contactUrl?: string;
  statusText?: string;
  showStatus?: boolean;
  theme: BannerTheme;
  template: BannerTemplateId;
}

export interface BannerTemplateMeta {
  id: BannerTemplateId;
  name: string;
  description: string;
  tag: string;
}
