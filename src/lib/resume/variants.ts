import fs from "fs";
import path from "path";
import crypto from "crypto";
import canonicalResumeData from "@/data/resume.json";
import { ResumeData } from "@/types/resume";
import { validateResumeLayout, LayoutValidationResult } from "./validator";

export interface ResumeVariant {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  locale: string;
  notes?: string;
  data: ResumeData;
  validation: LayoutValidationResult["budget"];
}

export type ResumeVariantSummary = Omit<ResumeVariant, "data">;

const VARIANTS_DIR = path.join(process.cwd(), "resumes", "variants");

function ensureVariantsDir(): string {
  if (!fs.existsSync(VARIANTS_DIR)) {
    fs.mkdirSync(VARIANTS_DIR, { recursive: true });
  }
  return VARIANTS_DIR;
}

/**
 * Returns the untouched canonical resume used by the public website.
 */
export function getCanonicalResume(): ResumeData {
  return JSON.parse(JSON.stringify(canonicalResumeData)) as ResumeData;
}

/**
 * Returns the extended master resume pool if available (e.g. config/resume.master.json
 * or demo/resume.json), falling back to the canonical resume.
 */
export function getMasterResume(): ResumeData {
  const masterPath = path.join(process.cwd(), "config", "resume.master.json");
  if (fs.existsSync(masterPath)) {
    try {
      const content = fs.readFileSync(masterPath, "utf8");
      return JSON.parse(content) as ResumeData;
    } catch {
      // Fall through to canonical
    }
  }
  return getCanonicalResume();
}

/**
 * Saves a tailored CV variant to disk under resumes/variants/.
 * Enforces layout validation and single-page safeguards before saving!
 */
export function saveVariant(params: {
  company: string;
  role: string;
  data: ResumeData;
  locale?: string;
  notes?: string;
}): { variant: ResumeVariant; validation: LayoutValidationResult } {
  const validation = validateResumeLayout(params.data);
  if (!validation.valid) {
    throw new Error(
      `Cannot save invalid variant:\n- ${validation.errors.join("\n- ")}`
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

  const variantId = `${dateStr}_${sanitizedCompany}_${sanitizedRole}_${randomSuffix}`;
  const filePath = path.join(VARIANTS_DIR, `${variantId}.json`);

  const variant: ResumeVariant = {
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
 * Retrieves a saved variant by ID.
 */
export function getVariant(variantId: string): ResumeVariant | null {
  const safeId = path.basename(variantId).replace(/\.json$/, "");
  const filePath = path.join(VARIANTS_DIR, `${safeId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ResumeVariant;
  } catch {
    return null;
  }
}

/**
 * Lists all saved resume variants (sorted newest first).
 */
export function listVariants(): ResumeVariantSummary[] {
  if (!fs.existsSync(VARIANTS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith(".json"));
  const summaries: ResumeVariantSummary[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(VARIANTS_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf8");
      const parsed = JSON.parse(raw) as ResumeVariant;
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
      // Ignore corrupt or unreadable files
    }
  }

  return summaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
