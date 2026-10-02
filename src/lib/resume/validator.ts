import { z } from "zod";
import { ResumeData } from "@/types/resume";

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

export const ResumeUrlSchema = z.object({
  href: z.string().url(),
});

export const ResumeItemSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean().default(true),
  institution: z.string().optional(),
  company: z.string().optional(),
  studyType: z.string().optional(),
  area: z.string().optional(),
  position: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
  score: z.string().optional(),
  url: ResumeUrlSchema.optional(),
  keywords: z.array(z.string()).optional(),
  name: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
  description: z.string().optional(),
  network: z.string().optional(),
  username: z.string().optional(),
});

export const ResumeSectionSchema = z.object({
  name: z.string().min(1),
  visible: z.boolean().default(true),
  items: z.array(ResumeItemSchema),
});

export const ResumeDataSchema = z.object({
  basics: z.object({
    name: z.string().min(1).max(50),
    headline: z.string().min(1).max(65),
    email: z.string().email(),
    phone: z.string().optional(),
    location: z.string().min(1).max(50),
    url: ResumeUrlSchema,
    picture: z.object({
      url: z.string(),
    }),
  }),
  display: z
    .object({
      experience: z.number().int().min(1).max(4).optional(),
      education: z.number().int().min(1).max(3).optional(),
    })
    .catchall(z.number().optional())
    .optional(),
  sections: z.object({
    summary: z.object({
      name: z.string().default("Summary"),
      visible: z.boolean().default(true),
      content: z.string().optional().default(""),
    }),
    education: ResumeSectionSchema,
    experience: ResumeSectionSchema,
    skills: ResumeSectionSchema,
    languages: ResumeSectionSchema,
    profiles: ResumeSectionSchema.optional(),
  }),
});

// ─── LAYOUT SAFEGUARDS & BUDGET CALCULATION ───────────────────────────────────

export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  budget: {
    estimatedMainHeightPx: number;
    estimatedSidebarHeightPx: number;
    maxSafeHeightPx: number;
    experienceCount: number;
    educationCount: number;
    skillCount: number;
    languageCount: number;
  };
  sanitizedData?: ResumeData;
}

// Total A4 page height at 96 DPI is 1123px.
// Safe content budget allowing padding, margins and print headers/footers:
export const MAX_SAFE_MAIN_HEIGHT_PX = 980;
export const MAX_SAFE_SIDEBAR_HEIGHT_PX = 950;

/**
 * Validates that the customized resume adheres strictly to the single-page A4
 * geometry and does NOT overflow onto a second page or break whitespace / spacings.
 */
export function validateResumeLayout(raw: unknown): LayoutValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parseResult = ResumeDataSchema.safeParse(raw);
  if (!parseResult.success) {
    const formatted = parseResult.error.format();
    return {
      valid: false,
      errors: [
        "Schema validation failed",
        JSON.stringify(formatted, null, 2),
      ],
      warnings: [],
      budget: {
        estimatedMainHeightPx: 0,
        estimatedSidebarHeightPx: 0,
        maxSafeHeightPx: MAX_SAFE_MAIN_HEIGHT_PX,
        experienceCount: 0,
        educationCount: 0,
        skillCount: 0,
        languageCount: 0,
      },
    };
  }

  const data = parseResult.data as ResumeData;

  // 1. Check Basics
  if (data.basics.headline.length > 55) {
    warnings.push(
      `Headline is ${data.basics.headline.length} chars (recommended ≤ 55) — long headlines may wrap and shift content downward.`
    );
  }

  // 2. Active item counts (respecting display limits)
  const display = data.display ?? {};
  const visibleExperiences = data.sections.experience.items.filter((i) => i.visible);
  const activeExpLimit = display.experience ?? visibleExperiences.length;
  const renderedExperiences = visibleExperiences.slice(0, activeExpLimit);

  const visibleEducations = data.sections.education.items.filter((i) => i.visible);
  const activeEduLimit = display.education ?? visibleEducations.length;
  const renderedEducations = visibleEducations.slice(0, activeEduLimit);

  const renderedSkills = data.sections.skills.items.filter((i) => i.visible);
  const renderedLanguages = data.sections.languages.items.filter((i) => i.visible);

  // 3. Strict Item Count Bounds
  if (renderedExperiences.length > 4) {
    errors.push(
      `Too many experience items (${renderedExperiences.length}). Maximum allowed for single-page A4 is 4 items.`
    );
  } else if (renderedExperiences.length === 0) {
    errors.push("At least 1 experience item is required.");
  }

  if (renderedEducations.length > 2 && renderedExperiences.length > 3) {
    errors.push(
      `Combined experience (${renderedExperiences.length}) and education (${renderedEducations.length}) exceeds vertical budget. If experience has 4 items, education must have at most 2.`
    );
  }

  if (renderedSkills.length > 6) {
    errors.push(
      `Too many skills (${renderedSkills.length}). Maximum allowed is 6 items to prevent sidebar overflow.`
    );
  } else if (renderedSkills.length < 3) {
    warnings.push(`Only ${renderedSkills.length} skills provided (recommended 4-6).`);
  }

  if (renderedLanguages.length > 3) {
    errors.push(
      `Too many languages (${renderedLanguages.length}). Maximum allowed is 3 items.`
    );
  }

  // 4. Character Length & Line-Clamp Guards on Experience
  renderedExperiences.forEach((exp, idx) => {
    if (!exp.position) {
      errors.push(`Experience item #${idx + 1} (${exp.company || "unknown"}) is missing position.`);
    }
    if (!exp.company) {
      errors.push(`Experience item #${idx + 1} is missing company.`);
    }
    if (exp.summary) {
      // Strip HTML tags to estimate actual text length
      const cleanSummary = exp.summary.replace(/<[^>]*>/g, "").trim();
      if (cleanSummary.length > 210) {
        errors.push(
          `Experience #${idx + 1} (${exp.company}): summary is ${cleanSummary.length} chars (maximum 200 chars). Longer summaries will be truncated by CSS line-clamp or spill onto page 2.`
        );
      } else if (cleanSummary.length > 175) {
        warnings.push(
          `Experience #${idx + 1} (${exp.company}): summary is ${cleanSummary.length} chars — keep concise (around 120-160 chars) for optimal single-page layout.`
        );
      }
    }
  });

  // 5. Height Budget Calculation
  // Right Column (Main content):
  // Header: Name (48px) + Headline (28px) + margins (24px) = ~100px
  // Section Headers: 2 * 36px = 72px
  // Experience items: each has ~36px (date+org) + ~24px (title) + ~40px (2-line summary) + 12px (gap) = ~112px
  // Education items: each has ~36px (date+inst) + ~24px (degree) + ~20px (area) + 12px (gap) = ~92px
  const headerHeight = 100;
  const sectionHeadersHeight = 72;
  const expHeight = renderedExperiences.reduce((sum, item) => {
    const hasSummary = Boolean(item.summary && item.summary.trim().length > 0);
    return sum + 60 + (hasSummary ? 44 : 0) + 12;
  }, 0);
  const eduHeight = renderedEducations.reduce((sum, item) => {
    const hasArea = Boolean(item.area && item.area.trim().length > 0);
    return sum + 60 + (hasArea ? 22 : 0) + 12;
  }, 0);

  const estimatedMainHeightPx = headerHeight + sectionHeadersHeight + expHeight + eduHeight;

  // Left Column (Sidebar):
  // Avatar: 176px + margins (24px) = 200px
  // Contact: Heading (30px) + 5 lines * 22px = 140px
  // Skills: Heading (30px) + N * 28px
  // Languages: Heading (30px) + M * 28px
  // Card padding: 48px
  const sidebarBase = 200 + 140 + 48;
  const skillsHeight = 30 + renderedSkills.length * 28;
  const languagesHeight = 30 + renderedLanguages.length * 28;
  const estimatedSidebarHeightPx = sidebarBase + skillsHeight + languagesHeight;

  if (estimatedMainHeightPx > MAX_SAFE_MAIN_HEIGHT_PX) {
    errors.push(
      `Total main column height (${estimatedMainHeightPx}px) exceeds safe single-page threshold (${MAX_SAFE_MAIN_HEIGHT_PX}px). Reduce experience count or trim summaries.`
    );
  }

  if (estimatedSidebarHeightPx > MAX_SAFE_SIDEBAR_HEIGHT_PX) {
    errors.push(
      `Total sidebar height (${estimatedSidebarHeightPx}px) exceeds safe single-page threshold (${MAX_SAFE_SIDEBAR_HEIGHT_PX}px). Reduce skill or language count.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    budget: {
      estimatedMainHeightPx,
      estimatedSidebarHeightPx,
      maxSafeHeightPx: MAX_SAFE_MAIN_HEIGHT_PX,
      experienceCount: renderedExperiences.length,
      educationCount: renderedEducations.length,
      skillCount: renderedSkills.length,
      languageCount: renderedLanguages.length,
    },
    sanitizedData: data,
  };
}
