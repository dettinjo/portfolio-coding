export type BannerTheme = "dark" | "light";

export type BannerTemplateId =
  | "terminal"      // Terminal Minimalist (Portfolio Signature)
  | "split"         // Architectural Split (Executive Modern)
  | "glow"          // Ambient Tech Glow (Modern Neo-Tech)
  | "framed";       // Framed Card (Portfolio Showcase)

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
