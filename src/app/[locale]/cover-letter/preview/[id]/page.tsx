import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { ResumeAutoPrint } from "@/components/resume/ResumeAutoPrint";
import { CoverLetterCard } from "@/components/cover-letter/CoverLetterCard";
import { getCoverLetterVariant } from "@/lib/cover-letter/variants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const variant = getCoverLetterVariant(id);
  if (!variant) {
    return { title: "Cover Letter Not Found" };
  }
  return {
    title: `Cover Letter - ${variant.data.basics?.name || "Candidate"} (${variant.company} - ${variant.role})`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CoverLetterVariantPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const variant = getCoverLetterVariant(id);
  if (!variant) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background/90 print:bg-background print:min-h-screen print:w-full print:p-0 print:box-border print:overflow-hidden">
      <Suspense fallback={null}>
        <ResumeAutoPrint />
      </Suspense>
      <div className="print:hidden">
        <UtilityHeader />
        {/* Banner indicating this is an AI tailored cover letter */}
        <div className="bg-primary/10 border-b border-primary/20 text-xs py-2 px-4 text-center text-muted-foreground flex items-center justify-center gap-2">
          <span className="font-semibold text-primary">Tailored Cover Letter:</span>
          <span>
            {variant.company} — {variant.role} ({variant.id})
          </span>
        </div>
      </div>

      <CoverLetterCard data={variant.data} showDownloadButton={true} />
    </div>
  );
}
