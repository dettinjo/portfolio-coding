import { type NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getVariant } from "@/lib/resume/variants";
import {
  generateResumePdf,
  findResumePdfPath,
} from "@/lib/resume/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;
  const variant = getVariant(id);

  if (!variant) {
    return NextResponse.json(
      { error: "Resume variant not found" },
      { status: 404 }
    );
  }

  const existingPdfPath = findResumePdfPath(variant.id);
  let pdfBuffer: Buffer;

  if (existingPdfPath) {
    pdfBuffer = fs.readFileSync(existingPdfPath);
  } else {
    try {
      const generated = await generateResumePdf({
        data: variant.data,
        company: variant.company,
        role: variant.role,
        locale: variant.locale,
        notes: variant.notes,
      });
      pdfBuffer = generated.pdfBuffer;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Download API] Failed to generate PDF on demand:", err);
      return NextResponse.json(
        { error: `PDF generation failed: ${message}` },
        { status: 500 }
      );
    }
  }

  const safeName = (variant.data.basics.name || "Resume")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  const safeCompany = variant.company
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");

  const filename = `Resume_${safeName}_${safeCompany}.pdf`;

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
