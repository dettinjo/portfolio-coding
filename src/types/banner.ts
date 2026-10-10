export type BannerTheme = "dark" | "light";

export type BannerTemplateId =
  | "terminal"        // Terminal with prompt (> Title █)
  | "terminal-clean"  // Terminal without prompt (Title █)
  | "title-only";     // Title only (vertically centered)

export type TerminalTagStyle = "block" | "bracket" | "inline" | "pipe" | "kv";
export type TerminalLinkStyle = "arrow" | "curl" | "kv" | "plain";
export type TerminalPrompt = ">" | "$" | "❯" | "none";
export type LinkPosition = "below" | "corner";
export type NameStyle = "path" | "plain";
export type TaglineStyle = "plain" | "comment";
export type LayoutAlignment = "mobile-safe" | "center" | "desktop-left";
export type StatusIcon =
  | "dot-green"
  | "dot-amber"
  | "dot-blue"
  | "sparkle"
  | "bolt"
  | "chevron"
  | "ring"
  | "none";

export interface BannerData {
  // Building Blocks
  name: string;
  showName?: boolean;
  nameStyle?: NameStyle;

  jobTitle: string;
  showJobTitle?: boolean;
  promptSymbol?: TerminalPrompt;
  showCursor?: boolean;

  contactUrl?: string;
  showContact?: boolean;
  linkPosition?: LinkPosition;
  linkStyle?: TerminalLinkStyle;

  skills: string[];
  showSkills?: boolean;
  tagStyle?: TerminalTagStyle;

  tagline?: string;
  showTagline?: boolean;
  taglineStyle?: TaglineStyle;

  statusText?: string;
  showStatus?: boolean;
  statusIcon?: StatusIcon;

  theme: BannerTheme;
  template: BannerTemplateId;
  layoutAlignment?: LayoutAlignment;
}

export interface BannerTemplateMeta {
  id: BannerTemplateId;
  name: string;
  description: string;
  tag: string;
}
