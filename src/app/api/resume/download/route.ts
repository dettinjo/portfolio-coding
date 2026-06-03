import { type NextRequest, NextResponse } from "next/server";
import puppeteer, { type Browser } from "puppeteer";
import resumeData from "@/data/resume.json";

// Singleton browser instance — reused across requests to avoid cold-start on
// every download. Lazily initialised on first request.
let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  return browserInstance;
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || `http://localhost:${process.env.PORT || 3000}`;

  // Append ?print=true so the page hides the nav header and download button.
  const resumeUrl = `${baseUrl}/en/resume?print=true`;

  try {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Set a viewport that matches A4 width at 96 dpi (794 px).
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    await page.goto(resumeUrl, {
      waitUntil: "networkidle0",
      timeout: 30_000,
    });

    // Wait for the main resume card to be fully rendered.
    await page.waitForSelector("main", { timeout: 10_000 });

    const pdfUint8 = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    const pdfBuffer = Buffer.from(pdfUint8);

    await page.close();

    const name = (resumeData as { basics?: { name?: string } }).basics?.name ?? "Resume";
    // Produce a safe ASCII filename: "Joel Dettinger" -> "Resume_Joel_Dettinger.pdf"
    const safeName = name.replace(/[^a-zA-Z0-9\s]/g, "").trim().replace(/\s+/g, "_");
    const filename = `Resume_${safeName}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
        // Allow caching for 5 minutes — short enough to stay dynamic,
        // long enough to avoid hammering Puppeteer on repeated clicks.
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("[/api/resume/download] PDF generation failed:", error);

    // Invalidate the stale browser so next request gets a fresh one.
    if (browserInstance) {
      await browserInstance.close().catch(() => undefined);
      browserInstance = null;
    }

    return NextResponse.json(
      { error: "Failed to generate PDF. Please try again." },
      { status: 500 }
    );
  }
}
