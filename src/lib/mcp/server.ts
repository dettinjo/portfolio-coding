import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getCanonicalResume,
  getMasterResume,
  getVariant,
  listVariants,
} from "@/lib/resume/variants";
import {
  validateResumeLayout,
  MAX_SAFE_MAIN_HEIGHT_PX,
  MAX_SAFE_SIDEBAR_HEIGHT_PX,
} from "@/lib/resume/validator";
import { generateResumePdf } from "@/lib/resume/pdf-generator";
import { ResumeData } from "@/types/resume";

export function createResumeMcpServer(): McpServer {
  const server = new McpServer({
    name: "portfolio-resume-tailor",
    version: "1.0.0",
  });

  // ─── TOOL 1: GET OFFICIAL RESUME (PRIMARY ENTRYPOINT) ─────────────────────
  const getOfficialResumeHandler = async () => {
    const resume = getCanonicalResume();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(resume, null, 2),
        },
      ],
    };
  };

  server.tool(
    "get_official_resume",
    "ALWAYS CALL THIS FIRST. Fetches the official, authoritative CV JSON currently published on the portfolio website. The AI MUST inspect this first to get a complete overview of the candidate's authentic profile, contact details, verified work history, education, and skills. All tailored resumes must be adapted from this official data as the foundation.",
    {},
    getOfficialResumeHandler
  );

  // Alias for backward compatibility
  server.tool(
    "get_canonical_resume",
    "Alias for get_official_resume. Returns the official website CV JSON.",
    {},
    getOfficialResumeHandler
  );

  // ─── TOOL 2: GET MASTER RESUME POOL ────────────────────────────────────────
  server.tool(
    "get_master_resume",
    "Returns the extended master resume pool (with all experiences, projects, and skills), if configured, or falls back to the canonical resume.",
    {},
    async () => {
      const resume = getMasterResume();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resume, null, 2),
          },
        ],
      };
    }
  );

  // ─── TOOL 3: GET LAYOUT GUIDELINES & SAFEGUARDS ───────────────────────────
  server.tool(
    "get_layout_guidelines",
    "Returns the formatting rules, character limits, and section budgets required to fit strictly on a single A4 page without breaking spacings.",
    {},
    async () => {
      const guidelines = {
        pageFormat: "Exact Single-Page A4 (210mm x 297mm)",
        strictRules: [
          "The CV MUST NEVER exceed 1 page. Spacings and margins must remain intact.",
          "Work experience: Exactly 3 to 4 items. If 4 items, keep summaries very brief.",
          "Work experience summary: Maximum 180-200 characters per item (approx. 2 lines). Longer summaries will be truncated by CSS line-clamp or cause page overflow.",
          "Education: Maximum 2 items (or max 3 if experience has only 2-3 items).",
          "Skills: Exactly 4 to 6 skills (level 1-5). More than 6 skills will overflow the left sidebar.",
          "Languages: 2 to 3 languages (level 1-5).",
          "Basics headline: Maximum 55 characters to avoid wrapping to multiple lines.",
        ],
        budgets: {
          maxSafeMainHeightPx: MAX_SAFE_MAIN_HEIGHT_PX,
          maxSafeSidebarHeightPx: MAX_SAFE_SIDEBAR_HEIGHT_PX,
        },
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(guidelines, null, 2),
          },
        ],
      };
    }
  );

  // ─── TOOL 4: VALIDATE RESUME LAYOUT (SAFEGUARD) ───────────────────────────
  server.tool(
    "validate_resume_layout",
    "Validates a proposed tailored ResumeData object against structural schemas and single-page A4 vertical height budgets before generating a PDF.",
    {
      resumeData: z
        .record(z.string(), z.any())
        .describe("The tailored ResumeData JSON object to validate"),
    },
    async ({ resumeData }) => {
      const validation = validateResumeLayout(resumeData);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                valid: validation.valid,
                errors: validation.errors,
                warnings: validation.warnings,
                budgetMetrics: validation.budget,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL 5: GENERATE TAILORED RESUME (PDF + PREVIEW) ──────────────────────
  server.tool(
    "generate_tailored_resume",
    "Validates layout, enforces single-page safeguards, renders an exact single-page A4 PDF using headless Chromium, saves the variant, and returns download and preview URLs.",
    {
      company: z
        .string()
        .min(1)
        .describe("Target company name, e.g. 'Stripe' or 'Vercel'"),
      role: z
        .string()
        .min(1)
        .describe("Target role title, e.g. 'Senior Backend Engineer'"),
      locale: z
        .enum(["en", "de", "es"])
        .default("en")
        .describe("Language for labels and sections (default: 'en')"),
      notes: z
        .string()
        .optional()
        .describe("Optional notes regarding specific job requirements or rationale"),
      resumeData: z
        .record(z.string(), z.any())
        .describe("The complete customized ResumeData JSON matching ResumeData schema"),
    },
    async ({ company, role, locale, notes, resumeData }) => {
      try {
        const result = await generateResumePdf({
          data: resumeData as unknown as ResumeData,
          company,
          role,
          locale,
          notes,
        });

        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL ||
          (process.env.PORT ? `http://localhost:${process.env.PORT}` : "");

        const fullDownloadUrl = baseUrl
          ? `${baseUrl}${result.downloadUrl}`
          : result.downloadUrl;
        const fullPreviewUrl = baseUrl
          ? `${baseUrl}/${locale}/resume/preview/${result.variant.id}`
          : `/${locale}/resume/preview/${result.variant.id}`;

        const responsePayload = {
          success: true,
          variantId: result.variant.id,
          company,
          role,
          locale,
          pageCount: result.pageCount,
          downloadUrl: fullDownloadUrl,
          previewUrl: fullPreviewUrl,
          pdfPath: result.pdfPath,
          pdfBase64: result.pdfBuffer.toString("base64"),
          budgetMetrics: result.variant.validation,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(responsePayload, null, 2),
            },
          ],
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `PDF Generation Failed: ${message}`,
            },
          ],
        };
      }
    }
  );

  // ─── TOOL 6: LIST SAVED VARIANTS ──────────────────────────────────────────
  server.tool(
    "list_saved_variants",
    "Lists all previously tailored resume variants saved on the server.",
    {},
    async () => {
      const variants = listVariants();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(variants, null, 2),
          },
        ],
      };
    }
  );

  // ─── TOOL 7: GET VARIANT BY ID ────────────────────────────────────────────
  server.tool(
    "get_variant",
    "Retrieves the details and ResumeData of a specific saved variant by its variant ID.",
    {
      variantId: z.string().describe("The variant ID"),
    },
    async ({ variantId }) => {
      const variant = getVariant(variantId);
      if (!variant) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Variant '${variantId}' not found.`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(variant, null, 2),
          },
        ],
      };
    }
  );

  // ─── MCP PROMPT: TAILOR CV FOR JOB ────────────────────────────────────────
  server.prompt(
    "tailor_cv_for_job",
    "Guides the AI step-by-step to adapt the resume for a given job description while strictly enforcing single-page A4 layout constraints.",
    {
      job_description: z.string().describe("The job description text or posting"),
      company_name: z.string().describe("Company name"),
      target_role: z.string().describe("Job title applied for"),
      language: z.enum(["en", "de"]).default("en").describe("Target language"),
    },
    async ({ job_description, company_name, target_role, language }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Please tailor my CV for the position of "${target_role}" at "${company_name}" (${language}).

Job Description:
${job_description}

Instructions:
1. ALWAYS call 'get_official_resume' FIRST to fetch my official CV JSON and get a complete overview of my verified profile, work history, education, and skills. Use this official data as the foundation to adapt.
2. Call 'get_layout_guidelines' to review the strict single-page A4 constraints.
3. Select the 4 to 6 most relevant skills and order them by importance for this role.
4. Select 3 to 4 relevant work experiences. Tailor each summary (max 180 chars per role) to highlight relevant achievements, metrics, and technologies.
5. Ensure basics.headline is concise (max 55 chars) matching the target role.
6. Run 'validate_resume_layout' on your modified JSON to ensure it satisfies all height budgets and does not overflow onto a 2nd page.
7. Finally, call 'generate_tailored_resume' to generate the pixel-perfect A4 PDF and provide me with the download link and preview URL.`,
            },
          },
        ],
      };
    }
  );

  return server;
}
