import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getCoverLetterVariant } from "@/lib/cover-letter/variants";
import { generateCoverLetterPdf } from "@/lib/cover-letter/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const variant = getCoverLetterVariant(id);

  if (!variant) {
    return NextResponse.json(
      { error: "Cover letter variant not found" },
      { status: 404 }
    );
  }

  const pdfPath = path.join(
    process.cwd(),
    "public",
    "downloads",
    "cover-letters",
    `${variant.id}.pdf`
  );

  let pdfBuffer: Buffer;

  if (fs.existsSync(pdfPath)) {
    pdfBuffer = fs.readFileSync(pdfPath);
  } else {
    try {
      const generated = await generateCoverLetterPdf({
        data: variant.data,
        company: variant.company,
        role: variant.role,
        locale: variant.locale,
        notes: variant.notes,
      });
      pdfBuffer = generated.pdfBuffer;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Cover Letter Download API] Failed to generate PDF on demand:", err);
      return NextResponse.json(
        { error: `PDF generation failed: ${message}` },
        { status: 500 }
      );
    }
  }

  const safeName = (variant.data.basics.name || "Candidate")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const safeCompany = variant.company
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const filename = `Cover_Letter_${safeName}_${safeCompany}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
