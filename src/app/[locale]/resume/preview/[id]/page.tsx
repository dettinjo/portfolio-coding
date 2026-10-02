import { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { ResumeAutoPrint } from "@/components/resume/ResumeAutoPrint";
import { ResumeCard } from "@/components/resume/ResumeCard";
import { getVariant } from "@/lib/resume/variants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const variant = getVariant(id);
  if (!variant) {
    return { title: "Resume Variant Not Found" };
  }
  return {
    title: `Resume - ${variant.data.basics.name} (${variant.company} - ${variant.role})`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ResumeVariantPreviewPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const variant = getVariant(id);
  if (!variant) {
    notFound();
  }

  const t = await getTranslations("ResumePage");
  const translations = {
    downloadPdf: t("downloadPdf"),
    resumeFilename: t("resumeFilename", {
      name: `${variant.data.basics.name}_${variant.company}`.replace(/\s+/g, "_"),
    }),
    contact: t("contact"),
    skills: t("skills"),
    languages: t("languages"),
    experience: t("experience"),
    education: t("education"),
  };

  return (
    <div className="min-h-screen bg-background/90 print:bg-background print:min-h-screen print:w-full print:p-0 print:box-border print:overflow-hidden">
      <Suspense fallback={null}>
        <ResumeAutoPrint />
      </Suspense>
      <div className="print:hidden">
        <UtilityHeader />
        {/* Banner indicating this is an AI tailored variant */}
        <div className="bg-primary/10 border-b border-primary/20 text-xs py-2 px-4 text-center text-muted-foreground flex items-center justify-center gap-2">
          <span className="font-semibold text-primary">Tailored Application CV:</span>
          <span>
            {variant.company} — {variant.role} ({variant.id})
          </span>
        </div>
      </div>

      <ResumeCard
        data={variant.data}
        locale={variant.locale || locale}
        translations={translations}
        showDownloadButton={true}
      />
    </div>
  );
}
