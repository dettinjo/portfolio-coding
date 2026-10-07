import { Globe, Mail, MapPin, Phone, Linkedin, Github } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { ResumeEntry } from "@/components/resume/ResumeItem";
import { PrintButton } from "@/components/resume/PrintButton";
import { ResumeData } from "@/types/resume";
import { withBasePath } from "@/lib/basePath";
import { siteConfig } from "@/lib/config";

export interface ResumeTranslations {
  downloadPdf?: string;
  resumeFilename?: string;
  contact?: string;
  skills?: string;
  languages?: string;
  experience?: string;
  education?: string;
}

const DEFAULT_TRANSLATIONS: Record<string, ResumeTranslations> = {
  en: {
    downloadPdf: "Download PDF",
    resumeFilename: "Resume_{name}",
    contact: "Contact",
    skills: "Skills",
    languages: "Languages",
    experience: "Experience",
    education: "Education",
  },
  de: {
    downloadPdf: "PDF herunterladen",
    resumeFilename: "Lebenslauf_{name}",
    contact: "Kontakt",
    skills: "Fähigkeiten",
    languages: "Sprachen",
    experience: "Berufserfahrung",
    education: "Ausbildung",
  },
  es: {
    downloadPdf: "Descargar PDF",
    resumeFilename: "Curriculum_{name}",
    contact: "Contacto",
    skills: "Habilidades",
    languages: "Idiomas",
    experience: "Experiencia",
    education: "Educación",
  },
};

interface ResumeCardProps {
  data: ResumeData;
  locale?: string;
  translations?: ResumeTranslations;
  showDownloadButton?: boolean;
}

export function ResumeCard({
  data,
  locale = "en",
  translations,
  showDownloadButton = true,
}: ResumeCardProps) {
  const t = {
    ...(DEFAULT_TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS.en),
    ...(translations || {}),
  };

  const { basics, sections } = data;

  const rawPictureUrl = basics.picture?.url;
  const isInvalidUrl =
    !rawPictureUrl ||
    rawPictureUrl.startsWith("http://localhost") ||
    rawPictureUrl.startsWith("https://localhost") ||
    rawPictureUrl.includes("localhost:9000");

  const avatarPath = isInvalidUrl
    ? withBasePath("/images/profile.webp")
    : withBasePath(rawPictureUrl);

  // Apply per-section display limits defined in resume.json `display` block
  const displayLimit = data.display ?? {};
  const experienceItems = (sections.experience?.items ?? [])
    .filter((i) => i.visible !== false)
    .slice(0, displayLimit.experience ?? undefined);

  const educationItems = (sections.education?.items ?? [])
    .filter((i) => i.visible !== false)
    .slice(0, displayLimit.education ?? undefined);

  const skillItems = (sections.skills?.items ?? []).filter(
    (i) => i.visible !== false
  );

  const languageItems = (sections.languages?.items ?? []).filter(
    (i) => i.visible !== false
  );

  // Social profiles
  const linkedinProfile = sections.profiles?.items?.find(
    (p) => p.network?.toLowerCase() === "linkedin"
  );
  const githubProfile = sections.profiles?.items?.find(
    (p) => p.network?.toLowerCase() === "github"
  );

  const filename = (t.resumeFilename || "Resume_{name}").replace(
    "{name}",
    (basics.name || "Resume").replace(/\s+/g, "_")
  );

  return (
    <div className="py-12 print:p-0">
      {/* Floating Download Button - Hidden in Print */}
      {showDownloadButton && (
        <div className="fixed bottom-8 right-8 z-50 print:hidden">
          <PrintButton
            label={t.downloadPdf || "Download PDF"}
            filename={filename}
          />
        </div>
      )}

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

          {/* LEFT COLUMN: Sidebar Container */}
          <aside className="p-4 pr-0 print:p-4 print:pr-0 print:h-full bg-white dark:bg-zinc-950">
            <div className="bg-zinc-900 text-zinc-100 p-6 md:p-8 flex flex-col gap-6 print:!flex print:p-6 print:h-full dark:bg-white dark:text-zinc-900 h-full rounded-2xl">
              {/* 1. Personal Details (Avatar & Contact) */}
              <div className="flex flex-col items-center gap-6">
                <Avatar className="h-40 w-40 lg:h-44 lg:w-44 group transition-all duration-500 ease-in-out bg-zinc-800 border-4 border-zinc-800 shadow-sm dark:bg-zinc-200 dark:border-zinc-200">
                  <Image
                    src={avatarPath}
                    alt={`Profile picture of ${basics.name}`}
                    fill
                    sizes="(max-width: 1024px) 160px, 176px"
                    priority
                    unoptimized
                    placeholder={siteConfig.person.avatarBlurDataUrl ? "blur" : "empty"}
                    blurDataURL={siteConfig.person.avatarBlurDataUrl || undefined}
                    className="object-cover object-top scale-[1.2] origin-bottom translate-y-4 transition-transform duration-500 ease-in-out"
                  />
                </Avatar>

                <section className="w-full">
                  <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                    {t.contact}
                  </h3>
                  <div className="space-y-2 text-xs w-full text-left">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        basics.location
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
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

                    {basics.url?.href && (
                      <a
                        href={basics.url.href}
                        target="_blank"
                        rel="noopener noreferrer"
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
                        rel="noopener noreferrer"
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
                        rel="noopener noreferrer"
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
                  {t.skills}
                </h3>
                <div className="flex flex-col gap-2">
                  {skillItems.map((skill) => (
                    <div key={skill.id}>
                      <h4 className="font-semibold text-xs text-zinc-200 dark:text-zinc-800">
                        {skill.name}
                      </h4>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Languages */}
              <section>
                <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                  {t.languages}
                </h3>
                <div className="flex flex-col gap-2">
                  {languageItems.map((lang) => (
                    <div key={lang.id}>
                      <div className="font-semibold text-xs text-zinc-200 dark:text-zinc-800">
                        {lang.name}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* RIGHT COLUMN: Main Content */}
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
                  {t.experience}
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
                  {t.education}
                </h2>
                <div className="space-y-3">
                  {educationItems.map((item) => (
                    <ResumeEntry key={item.id} item={item} type="education" />
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
