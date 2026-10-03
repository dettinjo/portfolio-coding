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
    name: "Terminal Minimalist",
    description: "Signature portfolio command-line aesthetic with monospace prompt, cursor, and code pill tokens.",
    tag: "Signature",
  },
  {
    id: "split",
    name: "Architectural Split",
    description: "Executive modern dual-zone layout honoring the avatar safe zone with a sleek vertical rule.",
    tag: "Modernist",
  },
  {
    id: "glow",
    name: "Ambient Tech Glow",
    description: "Contemporary neo-tech aesthetic with subtle ambient radial illumination and high-contrast typography.",
    tag: "Neo-Tech",
  },
  {
    id: "framed",
    name: "Framed Card",
    description: "Framed showcase container matching the portfolio's ResumeCard and CoverLetterCard styling.",
    tag: "Showcase",
  },
];

export const PRESET_JOB_TITLES: string[] = [
  "Full-Stack Engineer",
  "Senior Full-Stack Engineer",
  "Lead Software Architect",
  "Staff Software Engineer",
  "Cloud & DevOps Engineer",
  "Frontend Architect & Design Technologist",
  "Backend & Distributed Systems Engineer",
  "AI & Systems Engineer",
];

export const SUGGESTED_SKILLS: string[] = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Docker",
  "PostgreSQL",
  "Kubernetes",
  "AWS",
  "Tailwind CSS",
  "GraphQL",
  "Go",
  "Redis",
  "CI/CD",
];

export const DEFAULT_BANNER_DATA: BannerData = {
  jobTitle: "Senior Full-Stack Engineer",
  name: "Alex Rivera",
  tagline: "Building resilient distributed systems, modern web architectures & high-performance APIs.",
  skills: ["TypeScript", "Next.js", "React", "Node.js", "Docker", "PostgreSQL"],
  contactUrl: "alexrivera.dev",
  statusText: "Available for select roles",
  showStatus: true,
  theme: "dark",
  template: "terminal",
};
