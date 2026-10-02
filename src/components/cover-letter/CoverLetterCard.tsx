import { Globe, Mail, MapPin, Phone, Linkedin, Github, Building, Calendar, Hash } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { PrintButton } from "@/components/resume/PrintButton";
import { CoverLetterData } from "@/types/cover-letter";
import { withBasePath } from "@/lib/basePath";

interface CoverLetterCardProps {
  data: CoverLetterData;
  showDownloadButton?: boolean;
}

export function CoverLetterCard({
  data,
  showDownloadButton = true,
}: CoverLetterCardProps) {
  const { basics, profiles, recipient, position, content } = data;
  const avatarPath = withBasePath("/images/profile.webp");

  // Profile links
  const linkedinProfile = profiles?.find(
    (p) => p.network?.toLowerCase() === "linkedin"
  );
  const githubProfile = profiles?.find(
    (p) => p.network?.toLowerCase() === "github"
  );

  const safeFilename = `Cover_Letter_${(basics.name || "Candidate").replace(/\s+/g, "_")}_${(recipient.company || "Application").replace(/\s+/g, "_")}`;

  return (
    <div className="py-12 print:p-0">
      {/* Floating Download Button - Hidden in Print */}
      {showDownloadButton && (
        <div className="fixed bottom-8 right-8 z-50 print:hidden">
          <PrintButton label="Download PDF" filename={safeFilename} />
        </div>
      )}

      {/* Main Page Container (A4 sized card matching Resume design) */}
      <main className="w-auto md:w-[210mm] mx-4 md:mx-auto border-0 md:border border-zinc-200 dark:border-zinc-800 p-0 shadow-xl print:!shadow-none print:border-0 print:p-0 rounded-2xl print:rounded-none overflow-hidden isolate bg-white dark:bg-zinc-950 print:w-full print:h-[297mm] print:m-0 print:box-border">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] print:grid-cols-[280px_1fr] min-h-[297mm] print:min-h-[297mm] print:h-[297mm]">
          {/* MOBILE HEADER: Visible only on mobile, hidden in print */}
          <div className="md:hidden print:hidden p-8 pb-4 text-zinc-900 dark:text-zinc-100">
            <h1 className="text-4xl font-extrabold tracking-tight mb-1 mt-0 leading-none">
              {basics.name}
            </h1>
            <p className="text-lg font-medium opacity-80 mb-2">
              {basics.headline}
            </p>
            <div className="text-sm font-semibold text-primary">
              Application for: {position.title}
            </div>
          </div>

          {/* LEFT COLUMN: Sidebar Container (Identical to CV) */}
          <aside className="p-4 pr-0 print:p-4 print:pr-0 print:h-full bg-white dark:bg-zinc-950">
            <div className="bg-zinc-900 text-zinc-100 p-6 md:p-8 flex flex-col justify-between print:!flex print:p-6 print:h-full dark:bg-white dark:text-zinc-900 h-full rounded-2xl">
              <div className="flex flex-col items-center gap-6">
                {/* 1. Avatar */}
                <Avatar className="h-40 w-40 lg:h-44 lg:w-44 group transition-all duration-500 ease-in-out bg-zinc-800 border-4 border-zinc-800 shadow-sm dark:bg-zinc-200 dark:border-zinc-200">
                  <Image
                    src={avatarPath}
                    alt={`Profile picture of ${basics.name}`}
                    fill
                    sizes="(max-width: 1024px) 160px, 176px"
                    priority
                    className="object-cover object-top scale-[1.2] origin-bottom translate-y-4 transition-transform duration-500 ease-in-out"
                  />
                </Avatar>

                {/* 2. Personal Information & Links */}
                <section className="w-full">
                  <h3 className="text-sm font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                    Contact
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

              {/* 3. Recipient Info on Sidebar */}
              <section className="w-full pt-4 border-t border-zinc-800 dark:border-zinc-200">
                <h3 className="text-xs font-bold mb-2 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Recipient
                </h3>
                <div className="text-xs space-y-1 text-zinc-300 dark:text-zinc-700">
                  <div className="font-semibold text-zinc-100 dark:text-zinc-900 flex items-center gap-1.5">
                    <Building className="h-3 w-3 shrink-0 text-zinc-400 dark:text-zinc-500" />
                    <span>{recipient.company}</span>
                  </div>
                  {recipient.department && (
                    <div className="opacity-80">{recipient.department}</div>
                  )}
                  {recipient.contactPerson && (
                    <div className="opacity-80">{recipient.contactPerson}</div>
                  )}
                  {recipient.city && (
                    <div className="opacity-70">
                      {recipient.city}
                      {recipient.country ? `, ${recipient.country}` : ""}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </aside>

          {/* RIGHT COLUMN: Cover Letter Content */}
          <div className="bg-white text-zinc-900 px-6 py-6 md:px-8 md:py-8 print:px-6 print:py-6 dark:bg-zinc-950 dark:text-zinc-100 h-full flex flex-col justify-between print:h-full print:box-border">
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Header: Candidate Name & Headline */}
                <div className="mb-4 hidden md:block print:block">
                  <h1 className="text-4xl font-extrabold tracking-tight mb-1 mt-0 leading-none text-zinc-950 dark:text-zinc-50">
                    {basics.name}
                  </h1>
                  <p className="text-lg font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                    {basics.headline}
                  </p>
                </div>

                {/* Target Position Banner on Top */}
                <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Application for Position
                    </span>
                    {position.date && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        {position.date}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
                    {position.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 mt-1.5">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {recipient.company}
                    </span>
                    {position.referenceNumber && (
                      <span className="flex items-center gap-1 opacity-80">
                        <Hash className="h-3 w-3" />
                        Ref: {position.referenceNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Cover Letter Body */}
                <div className="space-y-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {content.salutation}
                  </p>

                  {content.paragraphs.map((paragraph, index) => (
                    <p key={index} className="leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Sign-off & Signature */}
              <div className="pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  {content.closing}
                </p>
                <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {content.signOffName || basics.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
