// Career-hub types used by the MCP server: resume projects, coursework and
// role profiles. Data lives in src/data/{extra-projects,coursework,role-profiles}.json,
// staged at build time from the private config repo (see scripts/fetch-portfolio.ts).

/** Role / track identifiers. Courses, projects and role profiles share them. */
export type TrackId = string;

/** A project as exposed in the master resume and role profiles. */
export interface CareerProject {
  /** Stable id: the GitHub repo slug, or the override key for manual entries. */
  id: string;
  name: string;
  /** Omitted for `portfolio-private` repos and private/client work. */
  url?: string;
  technologies: string[];
  /** ISO date (YYYY-MM-DD) of when the project was developed. */
  date?: string;
  /** Concise 1–2 sentence summary. */
  summary: string;
  /** Up to 2 concrete technical bullets (README-derived unless overridden). */
  highlights: string[];
  tracks: TrackId[];
  /** Where the data came from. */
  source: "github" | "manual";
  /** Context line, e.g. "Client project with Acme Corp". */
  context?: string;
}

/** One entry in extra-projects.json: overrides a GitHub project or adds one. */
export interface ProjectOverride {
  name?: string;
  url?: string | null;
  technologies?: string[];
  date?: string;
  summary?: string;
  highlights?: string[];
  /** Replaces inferred tracks. */
  tracks?: TrackId[];
  /** Added on top of inferred tracks. */
  extraTracks?: TrackId[];
  context?: string;
  /** Excludes the project from the resume/profiles entirely. */
  hidden?: boolean;
}

export interface ExtraProjectsFile {
  /** Keyed by GitHub repo slug (lower-case) to override, or a new id to add. */
  projects?: Record<string, ProjectOverride>;
}

export interface Course {
  name: string;
  /** Dutch 10-point scale. Absent for ungraded / not yet transcribed modules. */
  grade?: number;
  ects?: number;
  level?: string;
  date?: string;
  summary?: string;
  tracks: TrackId[];
  keywords: string[];
}

export interface Program {
  id: string;
  institution: string;
  degree: string;
  gpa?: string;
  ects?: number;
  note?: string;
  courses: Course[];
}

export interface Thesis {
  id: string;
  level: "MSc" | "BSc";
  title: string;
  institution: string;
  period?: string;
  summary: string;
  tracks: TrackId[];
  keywords: string[];
}

export interface CourseworkFile {
  gradingScale?: string;
  programs?: Program[];
  theses?: Thesis[];
}

export interface RoleSkill {
  /** ≤ 24 chars — rendered in the 182px CV sidebar. */
  name: string;
  keywords?: string[];
}

export interface RoleProfileConfig {
  roleId: string;
  title: string;
  /** CV headline, ≤ 48 chars. */
  headline: string;
  /** 1–3 sentence positioning statement (also used as the CV summary). */
  positioning: string;
  /** Track ids that count as a match for courses/projects. */
  tracks: TrackId[];
  /** Extra keywords that boost relevance of projects and courses. */
  keywords: string[];
  /** Project ids pinned to the top, in order. */
  featuredProjects?: string[];
  /** Course names pinned to the top, in order. */
  featuredCourses?: string[];
  /** Exactly the skills to show on the CV (max 6), in order. */
  skills: RoleSkill[];
  /** Experience ids in display order (others follow). Max 4 are rendered. */
  experienceOrder?: string[];
  /** Role-specific experience summaries keyed by experience id (≤ 160 chars). */
  experienceSummaries?: Record<string, string>;
  /** Education ids to render (max 2), in order. */
  education?: string[];
}

export interface RoleProfilesFile {
  roles?: RoleProfileConfig[];
}
