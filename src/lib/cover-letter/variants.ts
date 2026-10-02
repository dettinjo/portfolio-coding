import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CoverLetterData } from "@/types/cover-letter";
import { getCanonicalResume } from "@/lib/resume/variants";
import {
  validateCoverLetterLayout,
  CoverLetterValidationResult,
} from "./validator";

export interface CoverLetterVariant {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  locale: string;
  notes?: string;
  data: CoverLetterData;
  validation: CoverLetterValidationResult["budget"];
}

export type CoverLetterVariantSummary = Omit<CoverLetterVariant, "data">;

const VARIANTS_DIR = path.join(process.cwd(), "cover-letters", "variants");

function ensureVariantsDir(): string {
  if (!fs.existsSync(VARIANTS_DIR)) {
    fs.mkdirSync(VARIANTS_DIR, { recursive: true });
  }
  return VARIANTS_DIR;
}

/**
 * Generates a default starter cover letter template populated with the user's
 * official personal info from the website resume.
 */
export function getCoverLetterTemplate(
  company: string = "Target Company",
  role: string = "Position"
): CoverLetterData {
  const resume = getCanonicalResume();

  const profiles = resume.sections.profiles?.items?.map((p) => ({
    network: p.network || "Profile",
    username: p.username || "",
    url: p.url || { href: "" },
  }));

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return {
    basics: {
      name: resume.basics.name,
      headline: resume.basics.headline,
      email: resume.basics.email,
      phone: resume.basics.phone,
      location: resume.basics.location,
      url: resume.basics.url,
      picture: resume.basics.picture,
    },
    profiles,
    recipient: {
      company,
      department: "Hiring Team",
    },
    position: {
      title: role,
      date: today,
    },
    content: {
      salutation: "Dear Hiring Team,",
      paragraphs: [
        `I am writing to express my strong enthusiasm for the ${role} position at ${company}. With my background in engineering high-performance systems and full-stack solutions, I am excited about the opportunity to contribute to your team.`,
        `In my previous roles, I have specialized in building robust software architectures and scalable applications. My experience aligns closely with your technical requirements, particularly in designing scalable services and modern user interfaces.`,
        `I welcome the opportunity to discuss how my skill set and passion for technology can support ${company}'s goals. Thank you for your time and consideration.`,
      ],
      closing: "Sincerely,",
      signOffName: resume.basics.name,
    },
  };
}

/**
 * Saves a tailored cover letter variant after validating layout safeguards.
 */
export function saveCoverLetterVariant(params: {
  company: string;
  role: string;
  data: CoverLetterData;
  locale?: string;
  notes?: string;
}): { variant: CoverLetterVariant; validation: CoverLetterValidationResult } {
  const validation = validateCoverLetterLayout(params.data);
  if (!validation.valid) {
    throw new Error(
      `Cannot save invalid cover letter:\n- ${validation.errors.join("\n- ")}`
    );
  }

  ensureVariantsDir();

  const sanitizedCompany = params.company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const sanitizedRole = params.role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const dateStr = new Date().toISOString().slice(0, 10);
  const randomSuffix = crypto.randomBytes(3).toString("hex");

  const variantId = `cl_${dateStr}_${sanitizedCompany}_${sanitizedRole}_${randomSuffix}`;
  const filePath = path.join(VARIANTS_DIR, `${variantId}.json`);

  const variant: CoverLetterVariant = {
    id: variantId,
    createdAt: new Date().toISOString(),
    company: params.company,
    role: params.role,
    locale: params.locale || "en",
    notes: params.notes,
    data: validation.sanitizedData || params.data,
    validation: validation.budget,
  };

  fs.writeFileSync(filePath, JSON.stringify(variant, null, 2), "utf8");

  return { variant, validation };
}

/**
 * Retrieves a saved cover letter variant by ID.
 */
export function getCoverLetterVariant(variantId: string): CoverLetterVariant | null {
  const safeId = path.basename(variantId).replace(/\.json$/, "");
  const filePath = path.join(VARIANTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as CoverLetterVariant;
  } catch {
    return null;
  }
}

/**
 * Lists all saved cover letter variants (sorted newest first).
 */
export function listCoverLetterVariants(): CoverLetterVariantSummary[] {
  if (!fs.existsSync(VARIANTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith(".json"));
  const summaries: CoverLetterVariantSummary[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(VARIANTS_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = JSON.parse(raw) as CoverLetterVariant;
      summaries.push({
        id: parsed.id,
        createdAt: parsed.createdAt,
        company: parsed.company,
        role: parsed.role,
        locale: parsed.locale,
        notes: parsed.notes,
        validation: parsed.validation,
      });
    } catch {
      // Ignore corrupt files
    }
  }

  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
