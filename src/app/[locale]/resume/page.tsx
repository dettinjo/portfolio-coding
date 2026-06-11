import { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import { Globe, Mail, MapPin, Phone, Linkedin, Github } from "lucide-react";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { ResumeEntry } from "@/components/resume/ResumeItem";
import { PrintButton } from "@/components/resume/PrintButton";
import { ProficiencyBar } from "@/components/ProficiencyBar";
import resumeData from "@/data/resume.json";
import { ResumeData } from "@/types/resume";
import { ResumeAutoPrint } from "@/components/resume/ResumeAutoPrint";

const data = resumeData as unknown as ResumeData;
const avatarPath = "/images/profile.webp";

// Apply per-section display limits defined in resume.json `display` block.
// All raw items are preserved in the JSON — only rendering is restricted.
const displayLimit = data.display ?? {};
const experienceItems = data.sections.experience.items.slice(
  0,
  displayLimit.experience ?? undefined
);
const educationItems = data.sections.education.items.slice(
  0,
  displayLimit.education ?? undefined
);

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Resume - ${data.basics.name}`,
  };
}

export default async function ResumePage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string }>;
}) {
  const t = await getTranslations("ResumePage");
  const { basics, sections } = data;
  const params = await searchParams;
  const isPrintMode = params?.print === "true";

  // Get LinkedIn and GitHub profiles
  const linkedinProfile = sections.profiles?.items?.find(
    (profile) => profile.network?.toLowerCase() === "linkedin"
  );
  const githubProfile = sections.profiles?.items?.find(
    (profile) => profile.network?.toLowerCase() === "github"
  );

  return (
    // Outer page background: respects site theme. For print, we remove outer padding so the content background (zinc-950 or white) occupies the full page.
    <div className="min-h-screen bg-background/90 print:bg-background print:min-h-screen print:w-full print:p-0 print:box-border print:overflow-hidden">
      {/* ResumeAutoPrint is only needed for the old browser-print fallback */}
      {!isPrintMode && <ResumeAutoPrint />}
      <div className={isPrintMode ? "hidden" : "print:hidden"}>
        <UtilityHeader />
      </div>

      <div className="py-12 print:p-0">
        {/* Floating Download Button - Hidden in Puppeteer print mode and real print */}
        <div className={`fixed bottom-8 right-8 z-50 ${isPrintMode ? "hidden" : "print:hidden"}`}>
          <PrintButton
            // Label for the download button
            label={t("downloadPdf")}
            filename={t("resumeFilename", {
              name: (basics.name || "Resume").replace(/\s+/g, "_"),
            })}
          />
        </div>

        {/* Main Page Container (A4 sized card) */}
        <main className="w-auto md:w-[210mm] mx-4 md:mx-auto border-0 md:border border-zinc-200 dark:border-zinc-800 p-0 shadow-xl print:!shadow-none print:border-0 print:p-0 rounded-2xl print:rounded-none overflow-hidden isolate bg-white dark:bg-zinc-950 print:w-full print:h-[297mm] print:m-0 print:box-border">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] print:grid-cols-[280px_1fr] min-h-[297mm] print:min-h-[297mm] print:h-[297mm]">
            {/* MOBILE HEADER: Visible only on mobile, hidden in print */}
            <div className="md:hidden print:hidden p-8 pb-8 text-zinc-900 dark:text-zinc-100">
              <h1 className="text-5xl font-extrabold tracking-tight mb-2 mt-0 leading-none">
                {basics.name}
              </h1>
              <p className="text-xl font-medium opacity-80 whitespace-nowrap">
                {basics.headline}
              </p>
            </div>
            {/* LEFT COLUMN: Sidebar Container (White in Dark mode, Zinc-950 in Light mode, matching main background) */}
            <aside className="p-4 pr-0 print:p-4 print:pr-0 print:h-full bg-white dark:bg-zinc-950">
              {/* Sidebar Card Wrapper: Dark in Dark mode, White in Light mode */}
              <div className="bg-zinc-900 text-zinc-100 p-6 md:p-8 flex flex-col gap-6 print:!flex print:p-6 print:h-full dark:bg-white dark:text-zinc-900 h-full rounded-2xl">
                {/* 1. Personal Details (Avatar & Contact) */}
                <div className="flex flex-col items-center gap-6">
                  <Avatar
                    // Avatar background set to match the card background
                    className="h-40 w-40 lg:h-44 lg:w-44 group transition-all duration-500 ease-in-out bg-zinc-800 border-4 border-zinc-800 shadow-sm dark:bg-zinc-200 dark:border-zinc-200"
                  >
                    <Image
                      src={avatarPath}
                      alt="Profile picture of me"
                      fill
                      sizes="(max-width: 1024px) 160px, 176px"
                      priority
                      className="object-cover object-top scale-[1.2] origin-bottom translate-y-4 transition-transform duration-500 ease-in-out"
                    />
                  </Avatar>

                  <section className="w-full">
                    <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                      {t("contact")}
                    </h3>
                    <div className="space-y-2 text-xs w-full text-left">
                      {/* Contact Details */}
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          basics.location
                        )}`}
                        target="_blank"
                        className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <span>{basics.location}</span>
                      </a>

                      {basics.email && (
                        <a
                          href={`mailto:${basics.email}`}
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span className="tracking-tighter whitespace-nowrap">
                            {basics.email}
                          </span>
                        </a>
                      )}

                      {basics.phone && (
                        <a
                          href={`tel:${basics.phone.replace(/[\s()+-]/g, "")}`}
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>{basics.phone}</span>
                        </a>
                      )}

                      {basics.url.href && (
                        <a
                          href={basics.url.href}
                          target="_blank"
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>Portfolio</span>
                        </a>
                      )}

                      {linkedinProfile?.url?.href && (
                        <a
                          href={linkedinProfile.url.href}
                          target="_blank"
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Linkedin className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>LinkedIn</span>
                        </a>
                      )}

                      {githubProfile?.url?.href && (
                        <a
                          href={githubProfile.url.href}
                          target="_blank"
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Github className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </section>
                </div>

                {/* 2. Skills */}
                <section>
                  <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                    {t("skills")}
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {data.sections.skills.items.map((skill) => (
                      <div key={skill.id}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-zinc-200 dark:text-zinc-800">
                            {skill.name}
                          </h4>
                          {skill.level !== undefined && (
                            <ProficiencyBar
                              level={skill.level}
                              className="bg-zinc-800 [&>div]:bg-zinc-200 dark:bg-zinc-200 dark:[&>div]:bg-zinc-800"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 3. Languages */}
                <section>
                  <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                    {t("languages")}
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    {data.sections.languages.items.map((lang) => (
                      <div key={lang.id}>
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-zinc-200 dark:text-zinc-800">
                            {lang.name}
                          </div>
                          {lang.level !== undefined && (
                            <ProficiencyBar
                              level={lang.level}
                              className="bg-zinc-800 [&>div]:bg-zinc-200 dark:bg-zinc-200 dark:[&>div]:bg-zinc-800"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </aside>

            {/* RIGHT COLUMN: Main Content (White Background on Print in Dark Mode, Zinc-950 in Light Mode) */}
            <div className="bg-white text-zinc-900 px-6 py-6 md:px-8 md:py-8 print:px-6 print:py-6 dark:bg-zinc-950 dark:text-zinc-100 h-full flex flex-col justify-between print:h-full print:box-border">
              <div>
                {/* Header: Name & Headline - Hidden on Mobile */}
                <div className="mb-4 hidden md:block print:block">
                  <h1 className="text-5xl font-extrabold tracking-tight mb-1 mt-0 leading-none text-zinc-950 dark:text-zinc-50">
                    {basics.name}
                  </h1>
                  <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {basics.headline}
                  </p>
                </div>

                {/* Experience */}
                <section className="mb-4">
                  <h2 className="text-base font-bold mb-2 uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b pb-0.5 border-zinc-300 dark:border-zinc-800">
                    {t("experience")}
                  </h2>
                  <div className="space-y-3">
                    {experienceItems.map((item) => (
                      <ResumeEntry key={item.id} item={item} type="work" />
                    ))}
                  </div>
                </section>

                {/* Education */}
                <section>
                  <h2 className="text-base font-bold mb-2 uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b pb-0.5 border-zinc-300 dark:border-zinc-800">
                    {t("education")}
                  </h2>
                  <div className="space-y-3">
                    {educationItems.map((item) => (
                      <ResumeEntry key={item.id} item={item} type="education" />
                    ))}
                  </div>
                </section>
              </div>
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
