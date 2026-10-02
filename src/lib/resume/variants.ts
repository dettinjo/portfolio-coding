import fs from "fs";
import path from "path";
import crypto from "crypto";
import canonicalResumeData from "@/data/resume.json";
import { ResumeData } from "@/types/resume";
import { validateResumeLayout, LayoutValidationResult } from "./validator";

export const RETENTION_DAYS = 60; // 2 months retention
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface ResumeVariant {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  locale: string;
  notes?: string;
  data: ResumeData;
  validation: LayoutValidationResult["budget"];
  expiresAt?: string;
  daysRemaining?: number;
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
 * Automatically prunes resume variants and associated PDF files older than 60 days (2 months).
 */
export function pruneExpiredResumeVariants(): { deletedIds: string[] } {
  const deletedIds: string[] = [];
  const now = Date.now();

  for (const dir of getVariantsCandidateDirs()) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          let isExpired = now - stats.mtimeMs > RETENTION_MS;
          let variantId = path.basename(file, ".json");

          try {
            const raw = fs.readFileSync(fullPath, "utf8");
            const parsed = JSON.parse(raw) as ResumeVariant;
            if (parsed.createdAt) {
              const createdMs = new Date(parsed.createdAt).getTime();
              if (!isNaN(createdMs)) {
                isExpired = now - createdMs > RETENTION_MS;
              }
            }
            if (parsed.id) {
              variantId = parsed.id;
            }
          } catch {
            // If corrupt, allow mtime check to govern
          }

          if (isExpired) {
            fs.unlinkSync(fullPath);
            deletedIds.push(variantId);
            // Also delete associated PDF if exists
            const pdfCandidates = [
              path.join(process.cwd(), "public", "downloads", "resumes", `${variantId}.pdf`),
              path.join("/tmp", "resumes", "downloads", `${variantId}.pdf`),
            ];
            for (const pdfPath of pdfCandidates) {
              if (fs.existsSync(pdfPath)) {
                try {
                  fs.unlinkSync(pdfPath);
                } catch {
                  // ignore
                }
              }
            }
          }
        } catch {
          // ignore individual file error
        }
      }
    } catch {
      // ignore dir error
    }
  }

  return { deletedIds };
}

/**
 * Returns the untouched official resume used by the public website.
 * Reads freshly from disk to ensure real-time accuracy.
 */
export function getCanonicalResume(): ResumeData {
  let resume: ResumeData;
  const filePath = path.join(process.cwd(), "src", "data", "resume.json");
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      resume = JSON.parse(raw) as ResumeData;
    } catch {
      resume = JSON.parse(JSON.stringify(canonicalResumeData)) as ResumeData;
    }
  } else {
    resume = JSON.parse(JSON.stringify(canonicalResumeData)) as ResumeData;
  }

  // Sanitize picture URL: if missing or pointing to localhost/dead DB host, use canonical profile image
  const picUrl = resume.basics?.picture?.url;
  if (
    !picUrl ||
    picUrl.startsWith("http://localhost") ||
    picUrl.startsWith("https://localhost") ||
    picUrl.includes("localhost:9000")
  ) {
    if (resume.basics) {
      resume.basics.picture = {
        ...resume.basics.picture,
        url: "/images/profile.webp",
      };
    }
  }

  return resume;
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
  pruneExpiredResumeVariants();

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

  const nowMs = Date.now();
  const createdIso = new Date().toISOString();
  const expiresIso = new Date(nowMs + RETENTION_MS).toISOString();

  const variant: ResumeVariant = {
    id: variantId,
    createdAt: createdIso,
    expiresAt: expiresIso,
    daysRemaining: RETENTION_DAYS,
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
  pruneExpiredResumeVariants();

  const safeId = path.basename(variantId).replace(/\.json$/, "");
  for (const dir of getVariantsCandidateDirs()) {
    const filePath = path.join(dir, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as ResumeVariant;
        const createdMs = parsed.createdAt ? new Date(parsed.createdAt).getTime() : Date.now();
        const daysRemaining = Math.max(0, Math.ceil((createdMs + RETENTION_MS - Date.now()) / (24 * 60 * 60 * 1000)));
        return {
          ...parsed,
          expiresAt: parsed.expiresAt || new Date(createdMs + RETENTION_MS).toISOString(),
          daysRemaining,
        };
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
  pruneExpiredResumeVariants();

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
          const createdMs = parsed.createdAt ? new Date(parsed.createdAt).getTime() : Date.now();
          const daysRemaining = Math.max(0, Math.ceil((createdMs + RETENTION_MS - Date.now()) / (24 * 60 * 60 * 1000)));

          if (!map.has(parsed.id)) {
            map.set(parsed.id, {
              id: parsed.id,
              createdAt: parsed.createdAt,
              expiresAt: parsed.expiresAt || new Date(createdMs + RETENTION_MS).toISOString(),
              daysRemaining,
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
