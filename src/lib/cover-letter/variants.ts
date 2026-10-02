import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CoverLetterData } from "@/types/cover-letter";
import { getCanonicalResume } from "@/lib/resume/variants";
import {
  validateCoverLetterLayout,
  CoverLetterValidationResult,
} from "./validator";

export const RETENTION_DAYS = 60; // 2 months retention
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export interface CoverLetterVariant {
  id: string;
  createdAt: string;
  company: string;
  role: string;
  locale: string;
  notes?: string;
  data: CoverLetterData;
  validation: CoverLetterValidationResult["budget"];
  expiresAt?: string;
  daysRemaining?: number;
}

export type CoverLetterVariantSummary = Omit<CoverLetterVariant, "data">;

function getVariantsCandidateDirs(): string[] {
  const dirs = [path.join(process.cwd(), "cover-letters", "variants")];
  const tmpDir = path.join("/tmp", "cover-letters", "variants");
  if (!dirs.includes(tmpDir)) {
    dirs.push(tmpDir);
  }
  return dirs;
}

function ensureWritableVariantsDir(): string {
  const preferred = path.join(process.cwd(), "cover-letters", "variants");
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join("/tmp", "cover-letters", "variants");
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

/**
 * Automatically prunes cover letter variants and associated PDF files older than 60 days (2 months).
 */
export function pruneExpiredCoverLetterVariants(): { deletedIds: string[] } {
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
            const parsed = JSON.parse(raw) as CoverLetterVariant;
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
            // allow mtime to govern if corrupt
          }

          if (isExpired) {
            fs.unlinkSync(fullPath);
            deletedIds.push(variantId);
            // Also delete associated PDF if exists
            const pdfCandidates = [
              path.join(process.cwd(), "public", "downloads", "cover-letters", `${variantId}.pdf`),
              path.join("/tmp", "cover-letters", "downloads", `${variantId}.pdf`),
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
      // ignore
    }
  }

  return { deletedIds };
}

/**
 * Normalizes cover letter data so that verified contact info and links
 * default to matching the canonical CV unless explicitly overridden.
 */
export function normalizeCoverLetterData(data: CoverLetterData): CoverLetterData {
  const resume = getCanonicalResume();

  const canonicalProfiles = (resume.sections.profiles?.items || []).map((p) => ({
    network: p.network || "Profile",
    username: p.username || "",
    url: {
      href: p.url?.href || "",
    },
  }));

  const mergedBasics = {
    ...resume.basics,
    ...(data.basics || {}),
    picture: {
      url: data.basics?.picture?.url || resume.basics?.picture?.url || "/images/profile.webp",
    },
    url: data.basics?.url?.href
      ? data.basics.url
      : resume.basics.url?.href
      ? { href: resume.basics.url.href }
      : undefined,
    location: data.basics?.location || resume.basics.location,
    email: data.basics?.email || resume.basics.email,
    phone: data.basics?.phone || resume.basics.phone,
    name: data.basics?.name || resume.basics.name,
    headline: data.basics?.headline || resume.basics.headline,
  };

  const mergedProfiles =
    data.profiles && data.profiles.length > 0
      ? data.profiles
      : canonicalProfiles;

  return {
    ...data,
    basics: mergedBasics,
    profiles: mergedProfiles,
  };
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

  const profiles = (resume.sections.profiles?.items || []).map((p) => ({
    network: p.network || "Profile",
    username: p.username || "",
    url: {
      href: p.url?.href || "",
    },
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
      url: resume.basics.url?.href
        ? { href: resume.basics.url.href }
        : undefined,
      picture: {
        url: resume.basics.picture?.url || "/images/profile.webp",
      },
    },
    profiles,
    keyCompetencies: (resume.sections.skills?.items || [])
      .filter((s) => s.visible !== false)
      .slice(0, 5)
      .map((s) => s.name || "")
      .filter(Boolean),
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
  pruneExpiredCoverLetterVariants();

  const normalizedData = normalizeCoverLetterData(params.data);
  const validation = validateCoverLetterLayout(normalizedData);
  if (!validation.valid) {
    throw new Error(
      `Cannot save invalid cover letter:\n- ${validation.errors.join("\n- ")}`
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

  const variantId = `cl_${dateStr}_${sanitizedCompany}_${sanitizedRole}_${randomSuffix}`;
  const filePath = path.join(targetDir, `${variantId}.json`);

  const nowMs = Date.now();
  const createdIso = new Date().toISOString();
  const expiresIso = new Date(nowMs + RETENTION_MS).toISOString();

  const variant: CoverLetterVariant = {
    id: variantId,
    createdAt: createdIso,
    expiresAt: expiresIso,
    daysRemaining: RETENTION_DAYS,
    company: params.company,
    role: params.role,
    locale: params.locale || "en",
    notes: params.notes,
    data: validation.sanitizedData || normalizedData,
    validation: validation.budget,
  };

  fs.writeFileSync(filePath, JSON.stringify(variant, null, 2), "utf8");

  return { variant, validation };
}

/**
 * Retrieves a saved cover letter variant by ID.
 */
export function getCoverLetterVariant(variantId: string): CoverLetterVariant | null {
  pruneExpiredCoverLetterVariants();

  const safeId = path.basename(variantId).replace(/\.json$/, "");
  for (const dir of getVariantsCandidateDirs()) {
    const filePath = path.join(dir, `${safeId}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as CoverLetterVariant;
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
 * Lists all saved cover letter variants (sorted newest first).
 */
export function listCoverLetterVariants(): CoverLetterVariantSummary[] {
  pruneExpiredCoverLetterVariants();

  const map = new Map<string, CoverLetterVariantSummary>();

  for (const dir of getVariantsCandidateDirs()) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
      for (const file of files) {
        try {
          const fullPath = path.join(dir, file);
          const raw = fs.readFileSync(fullPath, "utf8");
          const parsed = JSON.parse(raw) as CoverLetterVariant;
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
          // Ignore corrupt files
        }
      }
    } catch {
      // Ignore unreadable dirs
    }
  }

  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
