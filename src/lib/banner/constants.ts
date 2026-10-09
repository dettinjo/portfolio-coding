import { BannerTemplateMeta, BannerData } from "@/types/banner";

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
  name: "Joel Dettinger",
  showName: true,
  nameStyle: "path",

  jobTitle: "AI Engineer",
  showJobTitle: true,
  promptSymbol: ">",

  contactUrl: "joeldettinger.com",
  showContact: true,
  linkPosition: "below",

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

  statusText: "open to work",
  showStatus: false,

  theme: "dark",
  template: "terminal",
};
