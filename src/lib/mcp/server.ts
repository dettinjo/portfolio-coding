import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getCanonicalResume,
  getMasterResume,
  getVariant,
  listVariants,
  pruneExpiredResumeVariants,
} from "@/lib/resume/variants";
import {
  validateResumeLayout,
  MAX_SAFE_MAIN_HEIGHT_PX,
  MAX_SAFE_SIDEBAR_HEIGHT_PX,
} from "@/lib/resume/validator";
import { generateResumePdf } from "@/lib/resume/pdf-generator";
import { ResumeData } from "@/types/resume";
import {
  getCoverLetterTemplate,
  getCoverLetterVariant,
  listCoverLetterVariants,
  pruneExpiredCoverLetterVariants,
} from "@/lib/cover-letter/variants";
import {
  validateCoverLetterLayout,
  MAX_SAFE_COVER_LETTER_HEIGHT_PX,
  MAX_RECOMMENDED_CHARS,
} from "@/lib/cover-letter/validator";
import { generateCoverLetterPdf } from "@/lib/cover-letter/pdf-generator";
import { CoverLetterData } from "@/types/cover-letter";
import { generateBannerPng } from "@/lib/banner/png-generator";
import {
  BANNER_TEMPLATES,
  DEFAULT_BANNER_DATA,
  LINKEDIN_BANNER_WIDTH,
  LINKEDIN_BANNER_HEIGHT,
  LINKEDIN_SAFE_AREAS,
} from "@/lib/banner/constants";
import { BannerData } from "@/types/banner";
import { siteConfig } from "@/lib/config";

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
          process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";

        const fullDownloadUrl = `${baseUrl}${result.downloadUrl}`;
        const fullPreviewUrl = `${baseUrl}/${locale}/resume/preview/${result.variant.id}`;

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
    "Lists all previously tailored resume variants saved on the server, including download and preview links.",
    {},
    async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";
      const variants = listVariants().map((v) => ({
        ...v,
        downloadUrl: `${baseUrl}/api/resume/download/${v.id}`,
        previewUrl: `${baseUrl}/${v.locale}/resume/preview/${v.id}`,
      }));
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
    "Retrieves the details, ResumeData, download link, and preview URL of a specific saved variant by its variant ID.",
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
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...variant,
                downloadUrl: `${baseUrl}/api/resume/download/${variant.id}`,
                previewUrl: `${baseUrl}/${variant.locale}/resume/preview/${variant.id}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL 8: GET COVER LETTER TEMPLATE ────────────────────────────────────
  server.tool(
    "get_cover_letter_template",
    "Generates a structured cover letter template populated with the candidate's official personal details, links, and target position header. AI should fetch this first to construct the cover letter.",
    {
      company: z.string().describe("Target company name"),
      role: z.string().describe("Position being applied for"),
    },
    async ({ company, role }) => {
      const template = getCoverLetterTemplate(company, role);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(template, null, 2),
          },
        ],
      };
    }
  );

  // ─── TOOL 9: VALIDATE COVER LETTER LAYOUT ─────────────────────────────────
  server.tool(
    "validate_cover_letter_layout",
    "Validates a proposed CoverLetterData JSON object against structural schema and single-page A4 vertical height budgets before PDF rendering.",
    {
      coverLetterData: z
        .record(z.string(), z.any())
        .describe("The CoverLetterData JSON object to validate"),
    },
    async ({ coverLetterData }) => {
      const validation = validateCoverLetterLayout(coverLetterData);
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
                guidelines: {
                  maxRecommendedChars: MAX_RECOMMENDED_CHARS,
                  maxSafeHeightPx: MAX_SAFE_COVER_LETTER_HEIGHT_PX,
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL 10: GENERATE TAILORED COVER LETTER (PDF) ────────────────────────
  server.tool(
    "generate_tailored_cover_letter",
    "Renders an exact single-page A4 PDF cover letter matching the portfolio visual design (sidebar links on left, position banner on top, body on right), saves the variant, and returns download/preview URLs.",
    {
      company: z.string().min(1).describe("Target company name"),
      role: z.string().min(1).describe("Position title applied for"),
      locale: z.enum(["en", "de", "es"]).default("en").describe("Target language"),
      notes: z.string().optional().describe("Optional notes"),
      coverLetterData: z
        .record(z.string(), z.any())
        .describe("The customized CoverLetterData JSON"),
    },
    async ({ company, role, locale, notes, coverLetterData }) => {
      try {
        const result = await generateCoverLetterPdf({
          data: coverLetterData as unknown as CoverLetterData,
          company,
          role,
          locale,
          notes,
        });

        const baseUrl =
          process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";

        const fullDownloadUrl = `${baseUrl}${result.downloadUrl}`;
        const fullPreviewUrl = `${baseUrl}/${locale}/cover-letter/preview/${result.variant.id}`;

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
              text: `Cover Letter Generation Failed: ${message}`,
            },
          ],
        };
      }
    }
  );

  // ─── TOOL 11: LIST SAVED COVER LETTERS ────────────────────────────────────
  server.tool(
    "list_saved_cover_letters",
    "Lists all previously tailored cover letter variants saved on the server, including download and preview links.",
    {},
    async () => {
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";
      const variants = listCoverLetterVariants().map((v) => ({
        ...v,
        downloadUrl: `${baseUrl}/api/cover-letter/download/${v.id}`,
        previewUrl: `${baseUrl}/${v.locale}/cover-letter/preview/${v.id}`,
      }));
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

  // ─── TOOL 12: GET SAVED COVER LETTER BY ID ────────────────────────────────
  server.tool(
    "get_saved_cover_letter",
    "Retrieves the details, CoverLetterData, download link, and preview URL of a saved cover letter variant by ID.",
    {
      variantId: z.string().describe("The cover letter variant ID"),
    },
    async ({ variantId }) => {
      const variant = getCoverLetterVariant(variantId);
      if (!variant) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Cover letter variant '${variantId}' not found.`,
            },
          ],
        };
      }
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                ...variant,
                downloadUrl: `${baseUrl}/api/cover-letter/download/${variant.id}`,
                previewUrl: `${baseUrl}/${variant.locale}/cover-letter/preview/${variant.id}`,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL 13: GET DOWNLOAD LINK ───────────────────────────────────────────
  server.tool(
    "get_download_link",
    "Returns the direct public download link and preview URL for any tailored CV or cover letter variant ID, or for the official website CV.",
    {
      variantId: z
        .string()
        .describe(
          "Variant ID (e.g. 'cl_2026-...' for cover letter or '2026-...' for resume, or 'official' / 'canonical' for the live website CV)"
        ),
    },
    async ({ variantId }) => {
      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";

      if (variantId === "official" || variantId === "canonical") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  variantId: "official",
                  documentType: "resume",
                  title: "Official Resume (Live Website)",
                  previewUrl: `${baseUrl}/en/resume`,
                  downloadUrl: `${baseUrl}/en/resume?print=true`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const isCoverLetter = variantId.startsWith("cl_");
      if (isCoverLetter) {
        const cl = getCoverLetterVariant(variantId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  variantId,
                  documentType: "cover-letter",
                  company: cl?.company,
                  role: cl?.role,
                  downloadUrl: `${baseUrl}/api/cover-letter/download/${variantId}`,
                  previewUrl: `${baseUrl}/${cl?.locale || "en"}/cover-letter/preview/${variantId}`,
                  exists: Boolean(cl),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const res = getVariant(variantId);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                variantId,
                documentType: "resume",
                company: res?.company,
                role: res?.role,
                downloadUrl: `${baseUrl}/api/resume/download/${variantId}`,
                previewUrl: `${baseUrl}/${res?.locale || "en"}/resume/preview/${variantId}`,
                exists: Boolean(res),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── MCP PROMPT: WRITE COVER LETTER FOR JOB ───────────────────────────────
  server.prompt(
    "write_cover_letter_for_job",
    "Guides the AI step-by-step to write a tailored single-page cover letter matching the position and company.",
    {
      job_description: z.string().describe("The job description text"),
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
              text: `Please write a professional, tailored single-page cover letter for the position of "${target_role}" at "${company_name}" (${language}).

Job Description:
${job_description}

Instructions:
1. Call 'get_cover_letter_template' with company: "${company_name}" and role: "${target_role}" to initialize my verified profile and structure.
2. Review my official resume via 'get_official_resume' so you reference my actual verified achievements, technologies, and career trajectory.
3. Write 3 to 4 clear, compelling body paragraphs:
   - Paragraph 1: Enthusiastic opening stating the target position and clear value proposition.
   - Paragraph 2: Core technical achievements and engineering experiences that directly solve the company's stated requirements.
   - Paragraph 3: Alignment with the company's culture, platform mission, and international agile environment.
   - Paragraph 4: Confident closing, availability for discussion, and appreciation.
4. Keep the total letter text between 1,400 and 1,900 characters (max 2,400 characters) so it fits elegantly on an exact single A4 page.
5. Run 'validate_cover_letter_layout' to ensure word/character counts satisfy the single-page budget.
6. Call 'generate_tailored_cover_letter' to render the pixel-perfect A4 PDF matching my portfolio CV styling and provide the download link.`,
            },
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

  // ─── TOOL 14: RECALL APPLICATION MATERIALS (INTERVIEW PREP) ───────────────
  server.tool(
    "recall_application_materials",
    "Recalls submitted tailored resumes and cover letters for a specific company or role to prepare for job interviews. Retained for 60 days on the server. Returns an interview briefing with the exact tailored achievements, skills, and cover letter arguments submitted, plus direct preview and download links.",
    {
      company: z
        .string()
        .optional()
        .describe("Target company name to search for (e.g. 'Stripe')"),
      role: z
        .string()
        .optional()
        .describe("Target position or role keyword (e.g. 'Senior Full-Stack')"),
      variantId: z
        .string()
        .optional()
        .describe("Exact variant ID to recall directly"),
      format: z
        .enum(["interview_briefing", "full_json"])
        .default("interview_briefing")
        .describe("Output format: 'interview_briefing' for conversational interview prep or 'full_json' for raw data"),
    },
    async ({ company, role, variantId, format }) => {
      // 1. Run automatic 60-day retention prune
      pruneExpiredResumeVariants();
      pruneExpiredCoverLetterVariants();

      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";

      const allResumes = listVariants();
      const allCoverLetters = listCoverLetterVariants();

      // Filter matches
      const filterItem = (item: { id: string; company: string; role: string }) => {
        if (variantId) {
          return item.id.toLowerCase() === variantId.toLowerCase();
        }
        let match = true;
        if (company) {
          const compTerm = company.toLowerCase().trim();
          match = match && item.company.toLowerCase().includes(compTerm);
        }
        if (role) {
          const roleTerm = role.toLowerCase().trim();
          match = match && item.role.toLowerCase().includes(roleTerm);
        }
        return match;
      };

      const matchedResumeSummaries = allResumes.filter(filterItem);
      const matchedCoverLetterSummaries = allCoverLetters.filter(filterItem);

      if (matchedResumeSummaries.length === 0 && matchedCoverLetterSummaries.length === 0) {
        const availableCompanies = Array.from(
          new Set([...allResumes.map((r) => r.company), ...allCoverLetters.map((c) => c.company)])
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  found: false,
                  message: `No application materials found matching query (company: "${company || ""}", role: "${role || ""}", variantId: "${variantId || ""}").`,
                  retentionPolicy: "Materials are automatically deleted 60 days after creation.",
                  availableCompanies: availableCompanies.length > 0 ? availableCompanies : ["None currently stored"],
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Fetch full variant objects
      const matchedResumes = matchedResumeSummaries
        .map((s) => getVariant(s.id))
        .filter((v): v is NonNullable<typeof v> => v !== null);

      const matchedCoverLetters = matchedCoverLetterSummaries
        .map((s) => getCoverLetterVariant(s.id))
        .filter((v): v is NonNullable<typeof v> => v !== null);

      if (format === "full_json") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  found: true,
                  resumes: matchedResumes.map((r) => ({
                    ...r,
                    downloadUrl: `${baseUrl}/api/resume/download/${r.id}`,
                    previewUrl: `${baseUrl}/${r.locale}/resume/preview/${r.id}`,
                  })),
                  coverLetters: matchedCoverLetters.map((cl) => ({
                    ...cl,
                    downloadUrl: `${baseUrl}/api/cover-letter/download/${cl.id}`,
                    previewUrl: `${baseUrl}/${cl.locale}/cover-letter/preview/${cl.id}`,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // Interview briefing format
      const briefing = {
        title: "Job Interview Recall Briefing",
        query: { company, role, variantId },
        retentionNotice: "Application materials are stored for 60 days from creation, then automatically deleted.",
        resumes: matchedResumes.map((r) => {
          const expItems = r.data.sections?.experience?.items || [];
          const skillItems = r.data.sections?.skills?.items || [];
          const eduItems = r.data.sections?.education?.items || [];
          return {
            variantId: r.id,
            company: r.company,
            role: r.role,
            submittedAt: r.createdAt,
            expiresAt: r.expiresAt,
            daysRemaining: r.daysRemaining,
            headline: r.data.basics?.headline,
            summary: r.data.sections?.summary?.content,
            tailoredWorkExperience: expItems.map((w) => ({
              company: w.company || w.name,
              position: w.position,
              period: w.date,
              tailoredSummary: w.summary || w.description,
            })),
            featuredSkills: skillItems.map((s) => ({
              name: s.name,
              level: s.level,
              keywords: s.keywords,
            })),
            education: eduItems.map((e) => ({
              institution: e.institution,
              degree: e.studyType,
              area: e.area,
              period: e.date,
            })),
            links: {
              previewUrl: `${baseUrl}/${r.locale}/resume/preview/${r.id}`,
              downloadUrl: `${baseUrl}/api/resume/download/${r.id}`,
            },
          };
        }),
        coverLetters: matchedCoverLetters.map((cl) => ({
          variantId: cl.id,
          company: cl.company,
          role: cl.role,
          submittedAt: cl.createdAt,
          expiresAt: cl.expiresAt,
          daysRemaining: cl.daysRemaining,
          salutation: cl.data.content?.salutation,
          letterParagraphs: cl.data.content?.paragraphs || [],
          keyCompetencies: cl.data.keyCompetencies,
          signOff: `${cl.data.content?.closing || "Sincerely"}, ${cl.data.content?.signOffName || cl.data.basics?.name || ""}`,
          links: {
            previewUrl: `${baseUrl}/${cl.locale}/cover-letter/preview/${cl.id}`,
            downloadUrl: `${baseUrl}/api/cover-letter/download/${cl.id}`,
          },
        })),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(briefing, null, 2),
          },
        ],
      };
    }
  );

  // ─── TOOL 15: LIST ALL APPLICATIONS ───────────────────────────────────────
  server.tool(
    "list_all_applications",
    "Lists all active saved CV and Cover Letter applications stored on the server with their target company, role, creation date, 60-day expiration date, days remaining, preview URL, and download URL.",
    {},
    async () => {
      pruneExpiredResumeVariants();
      pruneExpiredCoverLetterVariants();

      const baseUrl =
        process.env.NEXT_PUBLIC_SERVER_URL || "https://codeby.joeldettinger.de";

      const resumes = listVariants().map((v) => ({
        type: "resume" as const,
        id: v.id,
        company: v.company,
        role: v.role,
        locale: v.locale,
        createdAt: v.createdAt,
        expiresAt: v.expiresAt,
        daysRemaining: v.daysRemaining,
        downloadUrl: `${baseUrl}/api/resume/download/${v.id}`,
        previewUrl: `${baseUrl}/${v.locale}/resume/preview/${v.id}`,
      }));

      const coverLetters = listCoverLetterVariants().map((v) => ({
        type: "cover-letter" as const,
        id: v.id,
        company: v.company,
        role: v.role,
        locale: v.locale,
        createdAt: v.createdAt,
        expiresAt: v.expiresAt,
        daysRemaining: v.daysRemaining,
        downloadUrl: `${baseUrl}/api/cover-letter/download/${v.id}`,
        previewUrl: `${baseUrl}/${v.locale}/cover-letter/preview/${v.id}`,
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                retentionPolicy: "Materials are automatically deleted 60 days after creation.",
                totalApplications: resumes.length + coverLetters.length,
                resumes,
                coverLetters,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL 16: PRUNE EXPIRED MATERIALS ─────────────────────────────────────
  server.tool(
    "prune_expired_materials",
    "Manually triggers the pruning engine to clean up any CV and cover letter variants (and their generated PDFs) older than 60 days (2 months).",
    {},
    async () => {
      const deletedResumes = pruneExpiredResumeVariants();
      const deletedCoverLetters = pruneExpiredCoverLetterVariants();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                retentionDays: 60,
                prunedResumesCount: deletedResumes.deletedIds.length,
                prunedResumeIds: deletedResumes.deletedIds,
                prunedCoverLettersCount: deletedCoverLetters.deletedIds.length,
                prunedCoverLetterIds: deletedCoverLetters.deletedIds,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL: GENERATE LINKEDIN BANNER ─────────────────────────────────────
  server.tool(
    "generate_linkedin_banner",
    "Generates an official 1584x396 LinkedIn background banner tailored with a customizable Job Title, name, tagline, tech stack pills, and matching the developer portfolio styling. Supports Light Mode and Dark Mode, and 4 layout templates (terminal, split, glow, framed).",
    {
      jobTitle: z
        .string()
        .min(1)
        .describe("The Job Title / Headline to highlight (e.g. 'Senior Full-Stack Engineer', 'Lead Cloud Architect')"),
      name: z
        .string()
        .optional()
        .describe("Candidate full name (defaults to portfolio config name)"),
      tagline: z
        .string()
        .optional()
        .describe("Value proposition / engineering tagline"),
      skills: z
        .array(z.string())
        .optional()
        .describe("List of core skills / technologies to showcase as badge pills (max 7-8)"),
      theme: z
        .enum(["dark", "light"])
        .default("dark")
        .describe("Color theme: 'dark' (portfolio zinc-950) or 'light' (portfolio zinc-50)"),
      template: z
        .enum(["terminal", "split", "glow", "framed"])
        .default("terminal")
        .describe("Layout design idea: 'terminal' (signature CLI), 'split' (architectural modern), 'glow' (ambient neo-tech), or 'framed' (portfolio showcase)"),
      contactUrl: z
        .string()
        .optional()
        .describe("Portfolio or GitHub link to display"),
      statusText: z
        .string()
        .optional()
        .describe("Optional status badge text, e.g. 'Available for select roles'"),
      scale: z
        .enum(["1", "2"])
        .default("1")
        .describe("Scale factor: '1' for standard 1584x396px, '2' for crisp Retina 3168x792px"),
    },
    async ({
      jobTitle,
      name,
      tagline,
      skills,
      theme,
      template,
      contactUrl,
      statusText,
      scale,
    }) => {
      const bannerData: BannerData = {
        jobTitle,
        name: name || siteConfig.person.fullName || DEFAULT_BANNER_DATA.name,
        tagline: tagline || DEFAULT_BANNER_DATA.tagline,
        skills: skills && skills.length > 0 ? skills : DEFAULT_BANNER_DATA.skills,
        theme,
        template,
        contactUrl:
          contactUrl ||
          siteConfig.site.serverUrl?.replace(/^https?:\/\//, "") ||
          DEFAULT_BANNER_DATA.contactUrl,
        statusText: statusText || DEFAULT_BANNER_DATA.statusText,
        showStatus: Boolean(statusText || DEFAULT_BANNER_DATA.showStatus),
      };

      const scaleNum = scale === "2" ? 2 : 1;
      const result = await generateBannerPng(bannerData, {
        scale: scaleNum,
        saveToFile: true,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: `LinkedIn banner generated successfully (${result.width}x${result.height}px).`,
                jobTitle: bannerData.jobTitle,
                theme: bannerData.theme,
                template: bannerData.template,
                downloadUrl: result.downloadUrl,
                localFilePath: result.outputPath,
                dimensions: `${result.width}x${result.height}px`,
                aspectRatio: "4:1",
                safeZoneGuaranteed: true,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── TOOL: GET LINKEDIN BANNER GUIDELINES ────────────────────────────────
  server.tool(
    "get_linkedin_banner_guidelines",
    "Returns official LinkedIn background banner dimensions, safe area specifications, avatar collision rules, and available design templates matching the portfolio brand.",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                dimensions: {
                  width: LINKEDIN_BANNER_WIDTH,
                  height: LINKEDIN_BANNER_HEIGHT,
                  aspectRatio: "4:1",
                  maxFileSizeMB: 8,
                  recommendedFormats: ["PNG", "JPG"],
                },
                safeAreas: LINKEDIN_SAFE_AREAS,
                rules: [
                  "Desktop profile picture collision: Circular avatar occupies the bottom-left corner (~160px visible height). Keep text and primary branding beyond x: 340px.",
                  "Mobile responsive cropping: Screen viewports crop up to 15% from left and right edges. Keep critical messaging centered within the 1260x316px boundary.",
                  "Typography: Monospace accents for technical credibility paired with bold modern sans-serif headlines.",
                  "Color palettes: Strictly match portfolio HSL zinc scales (Dark: #18181b / Light: #fafafa).",
                ],
                availableTemplates: BANNER_TEMPLATES,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── MCP PROMPT: PREP FOR INTERVIEW ───────────────────────────────────────
  server.prompt(
    "prep_for_interview",
    "Prepares the candidate for an upcoming job interview by recalling the exact submitted CV achievements, tailored work history, and cover letter motivation.",
    {
      company: z.string().describe("Target company name to prepare for"),
      role: z.string().optional().describe("Position title (optional)"),
    },
    async ({ company, role }) => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `I have an upcoming interview with "${company}"${role ? ` for the position of "${role}"` : ""}. Please help me prepare thoroughly based on the exact materials I submitted to them.

Instructions:
1. Call 'recall_application_materials' with company: "${company}"${role ? `, role: "${role}"` : ""} to fetch the exact tailored CV and cover letter submitted.
2. Review the submitted headline, tailored achievements, highlighted skills, and cover letter motivation.
3. Provide a structured Interview Preparation Guide:
   - Executive Pitch: A 60-second opening statement aligned with the tailored CV headline.
   - Deep Dive Stories: 3-4 STAR method talking points based on the exact bullet points and project stories submitted.
   - Technical Highlights: How to speak to the featured skills and architectures mentioned.
   - Anticipated Tough Questions & Tailored Answers: Questions the interviewers at "${company}" will likely ask based on the submitted application.
   - Questions to Ask the Interviewer: Thoughtful, role-specific questions.`,
            },
          },
        ],
      };
    }
  );

  return server;
}
