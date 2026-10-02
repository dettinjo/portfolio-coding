import { z } from "zod";
import { CoverLetterData } from "@/types/cover-letter";

export const CoverLetterRecipientSchema = z.object({
  company: z.string().max(80).optional(),
  department: z.string().max(80).optional(),
  contactPerson: z.string().max(80).optional(),
  address: z.string().max(100).optional(),
  city: z.string().max(60).optional(),
  country: z.string().max(60).optional(),
});

export const CoverLetterPositionSchema = z.object({
  title: z.string().max(75).optional(),
  referenceNumber: z.string().max(50).optional(),
  date: z.string().max(40).optional(),
});

export const CoverLetterContentSchema = z.object({
  salutation: z.string().max(80).optional(),
  paragraphs: z
    .array(z.string().min(1))
    .min(1, "Cover letter must contain at least 1 paragraph")
    .max(5, "Cover letter must contain at most 5 paragraphs to fit on 1 page"),
  bulletPoints: z
    .array(z.string().min(1).max(250))
    .max(4, "Maximum 4 bullet points allowed")
    .optional(),
  closing: z.string().max(60).optional(),
  signOffName: z.string().max(60).optional(),
});

export const CoverLetterDataSchema = z.object({
  basics: z
    .object({
      name: z.string().max(50).optional(),
      headline: z.string().max(65).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      location: z.string().max(50).optional(),
      url: z
        .object({
          label: z.string().optional(),
          href: z.string().min(1),
        })
        .optional(),
      picture: z.object({ url: z.string() }).optional(),
    })
    .optional(),
  profiles: z
    .array(
      z.object({
        network: z.string(),
        username: z.string().optional(),
        url: z.object({
          label: z.string().optional(),
          href: z.string().min(1),
        }),
      })
    )
    .optional(),
  keyCompetencies: z
    .array(z.string().min(1).max(40))
    .max(6, "Maximum 6 key competencies allowed")
    .optional(),
  recipient: CoverLetterRecipientSchema.optional(),
  position: CoverLetterPositionSchema.optional(),
  content: CoverLetterContentSchema,
});

export interface CoverLetterValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  budget: {
    totalChars: number;
    totalWords: number;
    paragraphCount: number;
    estimatedHeightPx: number;
    maxSafeHeightPx: number;
  };
  sanitizedData?: CoverLetterData;
}

// Single-page A4 vertical height budget (approx 1,123px total at 96 DPI)
export const MAX_SAFE_COVER_LETTER_HEIGHT_PX = 950;
export const MAX_RECOMMENDED_CHARS = 2400;

export function validateCoverLetterLayout(raw: unknown): CoverLetterValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const parseResult = CoverLetterDataSchema.safeParse(raw);
  if (!parseResult.success) {
    return {
      valid: false,
      errors: [
        "Schema validation failed",
        JSON.stringify(parseResult.error.format(), null, 2),
      ],
      warnings: [],
      budget: {
        totalChars: 0,
        totalWords: 0,
        paragraphCount: 0,
        estimatedHeightPx: 0,
        maxSafeHeightPx: MAX_SAFE_COVER_LETTER_HEIGHT_PX,
      },
    };
  }

  const data = parseResult.data as CoverLetterData;
  const { content } = data;

  // Calculate text metrics
  const bulletsText = (content.bulletPoints || []).join(" ");
  const fullText = (content.paragraphs || []).join(" ") + " " + bulletsText;
  const totalChars = fullText.length;
  const totalWords = fullText.trim().split(/\s+/).filter(Boolean).length;
  const paragraphCount = (content.paragraphs || []).length;
  const bulletCount = (content.bulletPoints || []).length;

  if (totalChars > MAX_RECOMMENDED_CHARS) {
    errors.push(
      `Cover letter text is too long (${totalChars} characters / ~${totalWords} words). ` +
      `Maximum allowed is ${MAX_RECOMMENDED_CHARS} characters to ensure it fits strictly on a single A4 page.`
    );
  } else if (totalChars > 2100) {
    warnings.push(
      `Cover letter text is relatively long (${totalChars} characters). Recommended length is 1,400–1,900 characters for ideal white space.`
    );
  } else if (totalChars < 300) {
    warnings.push("Cover letter is very brief (under 300 characters).");
  }

  // Vertical Height Estimation:
  // Header: Application card = ~110px
  // Salutation + Sign-off: 70px
  // Content: ~21px per line (approx 75 chars per line) + paragraph gaps (16px per paragraph)
  // Bullet points: ~28px per bullet
  const headerHeight = 110;
  const salutationSignOffHeight = 70;
  const linesCount = (content.paragraphs || []).reduce(
    (lines, p) => lines + Math.ceil(p.length / 75),
    0
  );
  const textHeight = linesCount * 21;
  const paragraphGaps = Math.max(0, paragraphCount - 1) * 16;
  const bulletsHeight = bulletCount * 28;
  const estimatedHeightPx =
    headerHeight + salutationSignOffHeight + textHeight + paragraphGaps + bulletsHeight;

  if (estimatedHeightPx > MAX_SAFE_COVER_LETTER_HEIGHT_PX) {
    errors.push(
      `Estimated content height (${estimatedHeightPx}px) exceeds safe single-page threshold (${MAX_SAFE_COVER_LETTER_HEIGHT_PX}px). ` +
      `Please shorten one or more paragraphs to prevent the letter from spilling onto page 2.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    budget: {
      totalChars,
      totalWords,
      paragraphCount,
      estimatedHeightPx,
      maxSafeHeightPx: MAX_SAFE_COVER_LETTER_HEIGHT_PX,
    },
    sanitizedData: data,
  };
}
