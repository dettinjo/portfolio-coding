import path from "path";
import fs from "fs";
import puppeteer, { Browser } from "puppeteer";
import { ResumeData } from "@/types/resume";
import { validateResumeLayout } from "./validator";
import { saveVariant, ResumeVariant } from "./variants";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  browserInstance = await puppeteer.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  return browserInstance;
}

export interface PdfGenerationResult {
  variant: ResumeVariant;
  pdfPath: string;
  pdfBuffer: Buffer;
  downloadUrl: string;
  pageCount: number;
}

export function getResumePdfOutputDir(): string {
  const preferred = path.join(process.cwd(), "public", "downloads", "resumes");
  try {
    if (!fs.existsSync(preferred)) {
      fs.mkdirSync(preferred, { recursive: true });
    }
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch {
    const fallback = path.join("/tmp", "resumes", "downloads");
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

export function findResumePdfPath(variantId: string): string | null {
  const safeId = path.basename(variantId).replace(/\.pdf$/, "");
  const candidates = [
    path.join(process.cwd(), "public", "downloads", "resumes", `${safeId}.pdf`),
    path.join("/tmp", "resumes", "downloads", `${safeId}.pdf`),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * Counts the number of pages in a generated PDF buffer.
 */
function countPdfPages(buffer: Buffer): number {
  const content = buffer.toString("binary");
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 1;
}

/**
 * Generates an exact single-page A4 PDF for a given resume variant.
 * Enforces pre-render and post-render single-page layout safeguards.
 */
export async function generateResumePdf(params: {
  data: ResumeData;
  company: string;
  role: string;
  locale?: string;
  notes?: string;
}): Promise<PdfGenerationResult> {
  // 1. Pre-render Layout Safeguard
  const validation = validateResumeLayout(params.data);
  if (!validation.valid) {
    throw new Error(
      `Pre-render layout validation failed:\n- ${validation.errors.join("\n- ")}`
    );
  }

  // 2. Persist variant so the dynamic preview route can serve it
  const { variant } = saveVariant({
    data: params.data,
    company: params.company,
    role: params.role,
    locale: params.locale || "en",
    notes: params.notes,
  });

  // 3. Launch Puppeteer & navigate to print view
  const port = process.env.PORT || "3000";
  const baseUrl =
    process.env.INTERNAL_URL ||
    `http://127.0.0.1:${port}`;

  const previewUrl = `${baseUrl}/${variant.locale}/resume/preview/${variant.id}?print=true`;

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Exact A4 dimensions at 96 DPI: 794px width x 1123px height
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2,
    });

    // Emulate print media for exact CSS print rules
    await page.emulateMediaType("print");

    await page.goto(previewUrl, {
      waitUntil: "networkidle0",
      timeout: 30_000,
    });

    await page.waitForSelector("main", { timeout: 10_000 });

    // Ensure all images (including avatar) are fully decoded into memory before taking PDF snapshot
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    // 4. Post-render DOM Layout Safeguard
    // Inspect actual rendered DOM heights to ensure no overflow
    const layout = await page.evaluate(() => {
      const main = document.querySelector("main");
      const aside = document.querySelector("aside > div");
      const content = document.querySelector("main > div > div:last-child");

      if (!main) {
        return { found: false, error: "Main element not found" };
      }

      // 3px tolerance for fractional subpixel rounding
      const mainOverflow = main.scrollHeight - main.clientHeight > 3;
      const asideOverflow = aside ? aside.scrollHeight - aside.clientHeight > 3 : false;
      const contentOverflow = content ? content.scrollHeight - content.clientHeight > 3 : false;

      return {
        found: true,
        mainOverflow,
        asideOverflow,
        contentOverflow,
        mainScrollHeight: main.scrollHeight,
        mainClientHeight: main.clientHeight,
        asideScrollHeight: aside?.scrollHeight ?? 0,
        asideClientHeight: aside?.clientHeight ?? 0,
        contentScrollHeight: content?.scrollHeight ?? 0,
        contentClientHeight: content?.clientHeight ?? 0,
      };
    });

    if (!layout.found) {
      throw new Error("Failed to inspect DOM: main resume container not found.");
    }

    if (layout.mainOverflow || layout.contentOverflow) {
      throw new Error(
        `Layout Overflow Detected: Content exceeds single-page A4 bounds! ` +
        `Main column rendered ${layout.mainScrollHeight}px (capacity: ${layout.mainClientHeight}px). ` +
        `Please reduce work experience summary lengths or remove 1 experience item to preserve single-page layout.`
      );
    }

    if (layout.asideOverflow) {
      throw new Error(
        `Sidebar Overflow Detected: Sidebar content exceeds single-page bounds! ` +
        `Sidebar rendered ${layout.asideScrollHeight}px (capacity: ${layout.asideClientHeight}px). ` +
        `Please reduce the number of skills (max 6) or languages (max 3).`
      );
    }

    // 5. Generate PDF
    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
    const pdfBuffer = Buffer.from(pdfUint8);

    // 6. Post-render PDF Page Count Safeguard
    const pageCount = countPdfPages(pdfBuffer);
    if (pageCount > 1) {
      throw new Error(
        `Page Count Safeguard Failed: Generated PDF contains ${pageCount} pages instead of 1. ` +
        `Content must strictly fit onto a single A4 page.`
      );
    }

    // 7. Save PDF to downloads
    const outputDir = getResumePdfOutputDir();
    const pdfFileName = `${variant.id}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);
    fs.writeFileSync(pdfPath, pdfBuffer);

    const downloadUrl = `/api/resume/download/${variant.id}`;

    return {
      variant,
      pdfPath,
      pdfBuffer,
      downloadUrl,
      pageCount,
    };
  } finally {
    await page.close().catch(() => undefined);
  }
}
