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

// Total A4 page height at 96 DPI is 1123px.
// Safe content budget allowing padding, margins and print headers/footers:
export const MAX_SAFE_MAIN_HEIGHT_PX = 980;
export const MAX_SAFE_SIDEBAR_HEIGHT_PX = 950;

export interface ResumeLayoutRestrictions {
  pageFormat: string;
  categoryLimits: {
    experience: {
      maxItems: number;
      minItems: number;
      summaryMaxChars: number;
      summaryRecommendedChars: string;
      summaryMaxLines: number;
      positionMaxChars: number;
      companyMaxChars: number;
      dateMaxChars: number;
      rationale: string;
    };
    education: {
      maxItems: number;
      minItems: number;
      areaMaxChars: number;
      areaRecommendedChars: string;
      areaMaxLines: number;
      institutionMaxChars: number;
      studyTypeMaxChars: number;
      scoreMaxChars: number;
      dateMaxChars: number;
      rationale: string;
    };
    basics: {
      headlineMaxChars: number;
      headlineRecommendedChars: string;
      nameMaxChars: number;
      locationMaxChars: number;
      emailMaxChars: number;
      rationale: string;
    };
    skills: {
      maxItems: number;
      minItems: number;
      nameMaxChars: number;
      nameRecommendedChars: string;
      rationale: string;
    };
    languages: {
      maxItems: number;
      minItems: number;
      nameMaxChars: number;
      rationale: string;
    };
  };
  budgets: {
    maxSafeMainHeightPx: number;
    maxSafeSidebarHeightPx: number;
  };
}

export const RESUME_LAYOUT_RESTRICTIONS: ResumeLayoutRestrictions = {
  pageFormat: "Exact Single-Page A4 (210mm x 297mm)",
  categoryLimits: {
    experience: {
      maxItems: 4,
      minItems: 1,
      summaryMaxChars: 200,
      summaryRecommendedChars: "120-160",
      summaryMaxLines: 2,
      positionMaxChars: 50,
      companyMaxChars: 50,
      dateMaxChars: 30,
      rationale:
        "The right column content width is ~500px. Experience summaries are styled with CSS line-clamp-2 (~2 lines @ 14px font, ~68 chars/line). Any description exceeding 200 characters is automatically truncated with an ellipsis (...) in print and web views, losing content.",
    },
    education: {
      maxItems: 2,
      minItems: 1,
      areaMaxChars: 90,
      areaRecommendedChars: "30-65",
      areaMaxLines: 2,
      institutionMaxChars: 55,
      studyTypeMaxChars: 50,
      scoreMaxChars: 20,
      dateMaxChars: 30,
      rationale:
        "Specialization/area descriptions are styled with line-clamp-2. Max 90 characters fits within 1-2 lines without eating vertical space needed for experience entries.",
    },
    basics: {
      headlineMaxChars: 55,
      headlineRecommendedChars: "30-48",
      nameMaxChars: 40,
      locationMaxChars: 35,
      emailMaxChars: 32,
      rationale:
        "Basics headline is rendered with whitespace-nowrap in 20px font. Exceeding 55 characters clips the title or overflows past the right page margin.",
    },
    skills: {
      maxItems: 6,
      minItems: 3,
      nameMaxChars: 24,
      nameRecommendedChars: "10-20",
      rationale:
        "Rendered in the 182px net-width sidebar beside a 48px horizontal proficiency bar. Names > 24 characters squeeze or wrap the bar.",
    },
    languages: {
      maxItems: 3,
      minItems: 1,
      nameMaxChars: 20,
      rationale:
        "Rendered in the sidebar beside a proficiency bar; names > 20 characters wrap awkwardly.",
    },
  },
  budgets: {
    maxSafeMainHeightPx: MAX_SAFE_MAIN_HEIGHT_PX,
    maxSafeSidebarHeightPx: MAX_SAFE_SIDEBAR_HEIGHT_PX,
  },
};

export interface LayoutValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  restrictions: ResumeLayoutRestrictions;
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
      restrictions: RESUME_LAYOUT_RESTRICTIONS,
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

  // 1. Check Basics description & header limits
  if (data.basics.headline.length > 55) {
    errors.push(
      `Headline is ${data.basics.headline.length} chars (maximum 55 chars allowed). Headline is rendered with whitespace-nowrap and will clip or overflow the page.`
    );
  } else if (data.basics.headline.length > 48) {
    warnings.push(
      `Headline is ${data.basics.headline.length} chars (recommended ≤ 48) — long headlines may press against the page margin.`
    );
  }

  if (data.basics.location.length > 35) {
    errors.push(
      `Location '${data.basics.location}' is ${data.basics.location.length} chars (maximum 35 chars allowed). Must fit on a single line in the sidebar.`
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

  // 4. Character Length & Line-Clamp Guards on Experience descriptions & titles
  renderedExperiences.forEach((exp, idx) => {
    if (!exp.position) {
      errors.push(`Experience item #${idx + 1} (${exp.company || "unknown"}) is missing position.`);
    } else if (exp.position.length > 50) {
      errors.push(`Experience item #${idx + 1} position '${exp.position}' is too long (${exp.position.length} chars, maximum 50 chars).`);
    }

    if (!exp.company) {
      errors.push(`Experience item #${idx + 1} is missing company.`);
    } else if (exp.company.length > 50) {
      errors.push(`Experience item #${idx + 1} company '${exp.company}' is too long (${exp.company.length} chars, maximum 50 chars).`);
    }

    if (exp.summary) {
      // Strip HTML tags to estimate actual rendered text length
      const cleanSummary = exp.summary.replace(/<[^>]*>/g, "").trim();
      if (cleanSummary.length > 200) {
        errors.push(
          `Experience #${idx + 1} (${exp.company}): summary is ${cleanSummary.length} chars (maximum 200 chars allowed, max 2 lines). Longer summaries will be truncated by CSS line-clamp-2 with '...' or cause page overflow.`
        );
      } else if (cleanSummary.length > 160) {
        warnings.push(
          `Experience #${idx + 1} (${exp.company}): summary is ${cleanSummary.length} chars (recommended 120-160 chars for optimal 2-line presentation).`
        );
      }
    }
  });

  // 5. Character Length & Line-Clamp Guards on Education descriptions & titles
  renderedEducations.forEach((edu, idx) => {
    if (edu.institution && edu.institution.length > 55) {
      errors.push(`Education #${idx + 1} institution '${edu.institution}' is too long (${edu.institution.length} chars, maximum 55 chars).`);
    }
    if (edu.studyType && edu.studyType.length > 50) {
      errors.push(`Education #${idx + 1} degree/studyType '${edu.studyType}' is too long (${edu.studyType.length} chars, maximum 50 chars).`);
    }
    if (edu.area) {
      const cleanArea = edu.area.replace(/<[^>]*>/g, "").trim();
      if (cleanArea.length > 90) {
        errors.push(
          `Education #${idx + 1} (${edu.institution || "item"}): area/specialization is ${cleanArea.length} chars (maximum 90 chars allowed). Longer descriptions will be truncated by CSS line-clamp-2.`
        );
      } else if (cleanArea.length > 65) {
        warnings.push(
          `Education #${idx + 1} (${edu.institution || "item"}): area is ${cleanArea.length} chars (recommended 30-65 chars).`
        );
      }
    }
  });

  // 6. Guards on Skills & Languages (Sidebar width is 182px net)
  renderedSkills.forEach((skill) => {
    if (skill.name && skill.name.length > 24) {
      errors.push(
        `Skill '${skill.name}' is too long (${skill.name.length} chars, maximum 24 chars allowed). Skill names must fit beside the 48px proficiency bar in the 182px sidebar.`
      );
    } else if (skill.name && skill.name.length > 20) {
      warnings.push(`Skill '${skill.name}' is ${skill.name.length} chars (recommended ≤ 20 chars).`);
    }
  });

  renderedLanguages.forEach((lang) => {
    if (lang.name && lang.name.length > 20) {
      errors.push(`Language '${lang.name}' is too long (${lang.name.length} chars, maximum 20 chars allowed).`);
    }
  });

  // 7. Height Budget Calculation
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
    restrictions: RESUME_LAYOUT_RESTRICTIONS,
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
