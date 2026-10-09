export type BannerTheme = "dark" | "light";

export type BannerTemplateId =
  | "terminal"        // Terminal with prompt (> Title █)
  | "terminal-clean"  // Terminal without prompt (Title █)
  | "title-only";     // Title only (vertically centered)

export type TerminalTagStyle = "block" | "bracket" | "inline";
export type TerminalPrompt = ">" | "$" | "❯" | "none";

export interface BannerData {
  jobTitle: string;
  name: string;
  tagline: string;
  showTagline?: boolean;
  skills: string[];
  tagStyle?: TerminalTagStyle;
  promptSymbol?: TerminalPrompt;
  contactUrl?: string;
  showContact?: boolean;
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
