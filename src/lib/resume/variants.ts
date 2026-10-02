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

function getVariantsCandidateDirs(): string[] {
  const dirs = [path.join(process.cwd(), "resumes", "variants")];
  const tmpDir = path.join("/tmp", "resumes", "variants");
  if (!dirs.includes(tmpDir)) {
    dirs.push(tmpDir);
  }
  return dirs;
}

function ensureWritableVariantsDir(): string {
  const preferred = path.join(process.cwd(), "resumes", "variants");
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join("/tmp", "resumes", "variants");
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

/**
 * Returns the untouched official resume used by the public website.
 * Reads freshly from disk to ensure real-time accuracy.
 */
export function getCanonicalResume(): ResumeData {
  const filePath = path.join(process.cwd(), "src", "data", "resume.json");
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      return JSON.parse(raw) as ResumeData;
    } catch {
      // Fall through to bundled fallback
    }
  }
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

  const targetDir = ensureWritableVariantsDir();

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
  const filePath = path.join(targetDir, `${variantId}.json`);

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
  for (const dir of getVariantsCandidateDirs()) {
    const filePath = path.join(dir, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        return JSON.parse(raw) as ResumeVariant;
      } catch {
        // continue search
      }
    }
  }
  return null;
}

/**
 * Lists all saved resume variants (sorted newest first).
 */
export function listVariants(): ResumeVariantSummary[] {
  const map = new Map<string, ResumeVariantSummary>();

  for (const dir of getVariantsCandidateDirs()) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const fullPath = path.join(dir, file);
          const raw = fs.readFileSync(fullPath, "utf8");
          const parsed = JSON.parse(raw) as ResumeVariant;
          if (!map.has(parsed.id)) {
            map.set(parsed.id, {
              id: parsed.id,
              createdAt: parsed.createdAt,
              company: parsed.company,
              role: parsed.role,
              locale: parsed.locale,
              notes: parsed.notes,
              validation: parsed.validation,
            });
          }
        } catch {
          // Ignore corrupt or unreadable files
        }
      }
    } catch {
      // Ignore unreadable dirs
    }
  }

  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
