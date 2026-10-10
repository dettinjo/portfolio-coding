import {
  BannerTemplateMeta,
  BannerData,
  StatusIcon,
  TerminalLinkStyle,
  TerminalTagStyle,
} from "@/types/banner";

export const LINKEDIN_BANNER_WIDTH = 1584;
export const LINKEDIN_BANNER_HEIGHT = 396;
export const LINKEDIN_ASPECT_RATIO = 4; // 1584 / 396 = 4:1

// LinkedIn Safe Area Specifications (2025/2026 guidelines)
export const LINKEDIN_SAFE_AREAS = {
  // Desktop avatar overlay (circle)
  desktopAvatar: {
    centerX: 165,
    centerY: 310,
    radius: 95, // ~190px diameter
    label: "Desktop Profile Picture Zone",
  },
  // Mobile horizontal safe area (crops left and right margins)
  mobileSafeZone: {
    minX: 162,
    maxX: 1422,
    minY: 40,
    maxY: 356,
    width: 1260,
    height: 316,
    label: "Mobile Safe Zone (1260 × 316 px)",
  },
  // Content safe zone (guaranteed no avatar collision & no mobile cropping)
  contentSafeZone: {
    minX: 380,
    maxX: 1420,
    minY: 45,
    maxY: 350,
  },
};

export const STATUS_ICON_OPTIONS: {
  id: StatusIcon;
  label: string;
  glyph: string;
  color?: string;
}[] = [
  { id: "dot-green", label: "Green Dot", glyph: "●", color: "#22c55e" },
  { id: "dot-amber", label: "Amber Dot", glyph: "●", color: "#f59e0b" },
  { id: "dot-blue", label: "Cyan Dot", glyph: "●", color: "#06b6d4" },
  { id: "sparkle", label: "Sparkle", glyph: "✦", color: "#a855f7" },
  { id: "bolt", label: "Bolt", glyph: "⚡", color: "#eab308" },
  { id: "chevron", label: "Chevron", glyph: "❯", color: "#10b981" },
  { id: "ring", label: "Ring", glyph: "○", color: "#a1a1aa" },
  { id: "none", label: "None", glyph: "—" },
];

export const LINK_STYLE_OPTIONS: {
  id: TerminalLinkStyle;
  label: string;
  format: string;
}[] = [
  { id: "arrow", label: "↗ Arrow", format: "↗ url" },
  { id: "curl", label: "curl -sL", format: "curl -sL url" },
  { id: "kv", label: "web:", format: "web: url" },
  { id: "plain", label: "Plain", format: "url" },
];

export const TAG_STYLE_OPTIONS: {
  id: TerminalTagStyle;
  label: string;
  example: string;
}[] = [
  { id: "block", label: "Blocks", example: "[Python]" },
  { id: "bracket", label: "[  ]", example: "[ Python ]" },
  { id: "inline", label: "· Inline", example: "Python · Docker" },
  { id: "pipe", label: "| Pipe", example: "Python | Docker" },
  { id: "kv", label: "stack:", example: "stack: Python · Docker" },
];

export const BANNER_TEMPLATES: BannerTemplateMeta[] = [
  {
    id: "terminal",
    name: "Terminal Prompt",
    description: "Signature CLI prompt (> Title█) with code tags",
    tag: "Signature",
  },
  {
    id: "terminal-clean",
    name: "Clean Minimal",
    description: "Title with terminal block cursor (Title█) without prompt symbol",
    tag: "Clean",
  },
  {
    id: "title-only",
    name: "Title Only",
    description: "Centered headline with cursor, focusing purely on your role",
    tag: "Focused",
  },
];

export interface RolePreset {
  title: string;
  skills: string[];
}

export const QUICK_ROLE_PRESETS: RolePreset[] = [
  {
    title: "AI Engineer",
    skills: [
      "Python",
      "PyTorch",
      "LLMs & RAG",
      "LangChain",
      "Vector DBs",
      "Docker",
      "FastAPI",
    ],
  },
  {
    title: "Full-Stack Engineer",
    skills: ["TypeScript", "Next.js", "React", "Node.js", "Docker", "PostgreSQL"],
  },
  {
    title: "Cloud & DevOps Engineer",
    skills: ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Go", "Python"],
  },
  {
    title: "Software Architect",
    skills: [
      "TypeScript",
      "Go",
      "Kubernetes",
      "AWS",
      "PostgreSQL",
      "Kafka",
      "Distributed Systems",
    ],
  },
  {
    title: "Frontend Architect",
    skills: [
      "TypeScript",
      "React",
      "Next.js",
      "Tailwind CSS",
      "Design Systems",
      "Web Performance",
    ],
  },
];

export const PRESET_JOB_TITLES: string[] = QUICK_ROLE_PRESETS.map((p) => p.title);

export const SUGGESTED_SKILLS: string[] = [
  "Python",
  "PyTorch",
  "LLMs & RAG",
  "LangChain",
  "Vector DBs",
  "Docker",
  "FastAPI",
  "TypeScript",
  "Next.js",
  "React",
  "Node.js",
  "PostgreSQL",
  "Kubernetes",
  "AWS",
  "Go",
  "Redis",
];

export const DEFAULT_BANNER_DATA: BannerData = {
  // Building Blocks
  name: "Alex Rivera",
  showName: true,
  nameStyle: "path",

  jobTitle: "AI Engineer",
  showJobTitle: true,
  promptSymbol: "❯",
  showCursor: true,

  contactUrl: "alexrivera.dev",
  showContact: true,
  linkPosition: "below",
  linkStyle: "arrow",

  skills: [
    "Python",
    "PyTorch",
    "LLMs & RAG",
    "LangChain",
    "Vector DBs",
    "Docker",
    "FastAPI",
  ],
  showSkills: true,
  tagStyle: "block",

  tagline: "Building scalable agentic AI systems & production RAG",
  showTagline: false,
  taglineStyle: "plain",

  statusText: "open to work",
  showStatus: false,
  statusIcon: "dot-green",

  theme: "dark",
  template: "terminal",
};
