import { Metadata } from "next";

import { useTranslations } from "next-intl";
import {
  Globe,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Github,
} from "lucide-react";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ResumeEntry } from "@/components/resume/ResumeItem";
import { PrintButton } from "@/components/resume/PrintButton";
import { ProficiencyBar } from "@/components/ProficiencyBar";
import resumeData from "@/data/resume.json";
import { ResumeData } from "@/types/resume";
import { ResumeAutoPrint } from "@/components/resume/ResumeAutoPrint";

const data = resumeData as unknown as ResumeData;
const avatarPath = "/images/profile.webp";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Resume - ${data.basics.name}`,
  };
}

export default function ResumePage() {
  const t = useTranslations("ResumePage");
  const { basics, sections } = data;

  // Get LinkedIn and GitHub profiles
  const linkedinProfile = sections.profiles?.items?.find(
    (profile) => profile.network?.toLowerCase() === "linkedin"
  );
  const githubProfile = sections.profiles?.items?.find(
    (profile) => profile.network?.toLowerCase() === "github"
  );

  return (
    // Outer page background remains dark (bg-background/90)
    <div className="min-h-screen bg-background/90 print:p-0 print:!bg-white print:min-h-0">
      <ResumeAutoPrint />
      <div className="print:hidden">
        <UtilityHeader />
      </div>
      
      <div className="py-12 print:py-0">
        {/* Floating Download Button - Hidden in Print */}
        <div className="fixed bottom-8 right-8 z-50 print:hidden">
          <PrintButton
            // Label for the download button
            label={t("downloadPdf")}
            filename={t("resumeFilename")}
          />
        </div>

      {/* Main Page Container (A4 sized card) */}
      <main
        className="w-[210mm] mx-auto border-2 border-foreground p-6 shadow-xl print:!shadow-none print:border-0 print:p-0 rounded-xl overflow-hidden isolate bg-zinc-950 dark:bg-white print:!w-full print:min-h-screen print:rounded-none"
      >
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] print:grid-cols-[300px_1fr] min-h-[297mm] print:min-h-0">
          {/* LEFT COLUMN: Sidebar Container */}
          <aside className="print:p-0">
            {/* Floating Card Wrapper */}
            <div className="bg-white text-zinc-900 p-8 md:p-12 flex flex-col gap-8 print:!flex print:m-6 print:p-8 print:rounded-xl print:h-[calc(100%-3rem)] dark:bg-zinc-900 dark:text-zinc-100 h-full rounded-xl">
            {/* 1. Personal Details (Avatar & Contact) */}
            <div className="flex flex-col items-center gap-8 md:gap-12">
              <Avatar
                // Avatar background set to white to fill the circle
                className="h-48 w-48 lg:h-56 lg:w-56 group transition-all duration-500 ease-in-out bg-zinc-900 border-4 border-zinc-900 shadow-sm dark:bg-white dark:border-white"
              >
                <AvatarImage
                  src={avatarPath}
                  alt="Profile picture of me"
                  className="object-cover object-top scale-[1.2] origin-bottom translate-y-4 transition-transform duration-500 ease-in-out"
                />
                <AvatarFallback>{basics.name[0]}</AvatarFallback>
              </Avatar>

              <section className="w-full">
                <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-primary border-b pb-1 border-zinc-200 dark:border-zinc-700">
                  {t("contact")}
                </h3>
              <div className="space-y-3 text-sm w-full text-left">
                {/* Contact Details: Text set to white/light for dark card */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    basics.location
                  )}`}
                  target="_blank"
                  className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{basics.location}</span>
                </a>

                {basics.email && (
                  <a
                    href={`mailto:${basics.email}`}
                    className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="tracking-tighter whitespace-nowrap">{basics.email}</span>
                  </a>
                )}

                {basics.phone && (
                  <a
                    href={`tel:${basics.phone.replace(/[\s()+-]/g, "")}`}
                    className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{basics.phone}</span>
                  </a>
                )}

                {basics.url.href && (
                  <a
                    href={basics.url.href}
                    target="_blank"
                    className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>Portfolio</span>
                  </a>
                )}

                {linkedinProfile?.url?.href && (
                  <a
                    href={linkedinProfile.url.href}
                    target="_blank"
                    className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                  >
                    <Linkedin className="h-4 w-4 shrink-0" />
                    <span>LinkedIn</span>
                  </a>
                )}

                {githubProfile?.url?.href && (
                  <a
                    href={githubProfile.url.href}
                    target="_blank"
                    className="flex items-center gap-2 text-zinc-900 hover:text-primary transition-colors justify-start dark:text-zinc-100 dark:hover:text-primary relative print:z-10 print:text-zinc-900"
                  >
                    <Github className="h-4 w-4 shrink-0" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
              </section>
            </div>

            {/* 2. Skills */}
            <section>
              <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-primary border-b pb-1 border-zinc-200 dark:border-zinc-700">
                {t("skills")}
              </h3>
              <div className="flex flex-col gap-4">
                {data.sections.skills.items.map((skill) => (
                  <div key={skill.id}>
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                        {skill.name}
                      </h4>
                      {skill.level !== undefined && (
                        <ProficiencyBar
                          level={skill.level}
                          className="bg-zinc-200 [&>div]:bg-zinc-900 dark:bg-white/20 dark:[&>div]:bg-white"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Languages */}
            <section>
              <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-primary border-b pb-1 border-zinc-200 dark:border-zinc-700">
                {t("languages")}
              </h3>
              <div className="flex flex-col gap-4">
                {data.sections.languages.items.map((lang) => (
                  <div key={lang.id}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{lang.name}</div>
                      {lang.level !== undefined && (
                        <ProficiencyBar
                          level={lang.level}
                          className="bg-zinc-200 [&>div]:bg-zinc-900 dark:bg-white/20 dark:[&>div]:bg-white"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            </div>
          </aside>

          {/* RIGHT COLUMN: Main Content (White Background) */}
          <div
            className="bg-zinc-950 px-8 pb-8 pt-0 md:px-12 md:pb-12 md:pt-0 print:px-8 print:pb-8 print:pt-6 dark:bg-white text-zinc-100 dark:text-zinc-900 h-full rounded-xl"
          >
            {/* Header: Name & Headline */}
            <div className="mb-2">
              {/* Text uses explicit dark colors for white background */}
              <h1 className="text-5xl font-extrabold tracking-tight mb-2 mt-0 leading-none">
                {basics.name}
              </h1>
              <p className="text-xl font-medium opacity-80 whitespace-nowrap">
                {basics.headline}
              </p>
            </div>

            {/* Experience */}
            <section className="mb-2">
              <h2 className="text-xl font-bold mb-3 uppercase tracking-wider border-b pb-1 border-zinc-200 dark:border-zinc-700 max-w-md">
                {t("experience")}
              </h2>
              <div className="space-y-4">
                {data.sections.experience.items.map((item) => (
                  <ResumeEntry key={item.id} item={item} type="work" />
                ))}
              </div>
            </section>

            {/* Education */}
            <section>
              <h2 className="text-xl font-bold mb-3 uppercase tracking-wider border-b pb-1 border-zinc-200 dark:border-zinc-700 max-w-md">
                {t("education")}
              </h2>
              <div className="space-y-4">
                {data.sections.education.items.map((item) => (
                  <ResumeEntry key={item.id} item={item} type="education" />
                ))}
              </div>
            </section>
          </div>
          {/* End of RIGHT COLUMN */}
        </div>
        {/* End of Grid Div */}
      </main>
      </div>
      {/* End of Main Card Container */}
    </div>
  );
}
