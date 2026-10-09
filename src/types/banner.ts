export type BannerTheme = "dark" | "light";

export type BannerTemplateId =
  | "terminal"        // Terminal with prompt (> Title █)
  | "terminal-clean"  // Terminal without prompt (Title █)
  | "title-only";     // Title only (vertically centered)

export type TerminalTagStyle = "block" | "bracket" | "inline";
export type TerminalPrompt = ">" | "$" | "❯" | "none";
export type LinkPosition = "below" | "corner";
export type NameStyle = "path" | "plain";

export interface BannerData {
  // Building Blocks
  name: string;
  showName?: boolean;
  nameStyle?: NameStyle;

  jobTitle: string;
  showJobTitle?: boolean;
  promptSymbol?: TerminalPrompt;

  contactUrl?: string;
  showContact?: boolean;
  linkPosition?: LinkPosition;

  skills: string[];
  showSkills?: boolean;
  tagStyle?: TerminalTagStyle;

  tagline?: string;
  showTagline?: boolean;

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
