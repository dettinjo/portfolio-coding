import { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import resumeData from "@/data/resume.json";
import { ResumeData } from "@/types/resume";
import { ResumeAutoPrint } from "@/components/resume/ResumeAutoPrint";
import { ResumeCard } from "@/components/resume/ResumeCard";

const data = resumeData as unknown as ResumeData;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Resume - ${data.basics.name}`,
  };
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale); // keep this page statically renderable
  const t = await getTranslations("ResumePage");

  const translations = {
    downloadPdf: t("downloadPdf"),
    resumeFilename: t("resumeFilename", {
      name: (data.basics.name || "Resume").replace(/\s+/g, "_"),
    }),
    contact: t("contact"),
    skills: t("skills"),
    languages: t("languages"),
    experience: t("experience"),
    education: t("education"),
  };

  return (
    <div className="min-h-screen bg-background/90 print:bg-background print:min-h-screen print:w-full print:p-0 print:box-border print:overflow-hidden">
      {/* Auto-triggers window.print() when opened with ?print=true (client-side). */}
      <Suspense fallback={null}>
        <ResumeAutoPrint />
      </Suspense>
      <div className="print:hidden">
        <UtilityHeader />
      </div>

      <ResumeCard
        data={data}
        locale={locale}
        translations={translations}
        showDownloadButton={true}
      />
    </div>
  );
}
