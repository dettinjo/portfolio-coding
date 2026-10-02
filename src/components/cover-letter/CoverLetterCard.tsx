import {
  Globe,
  Mail,
  MapPin,
  Phone,
  Linkedin,
  Github,
  Building,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import { PrintButton } from "@/components/resume/PrintButton";
import { CoverLetterData } from "@/types/cover-letter";
import { withBasePath } from "@/lib/basePath";

interface CoverLetterCardProps {
  data: CoverLetterData;
  showDownloadButton?: boolean;
}

/**
 * Parses any reference string format into a sleek, modern badge structure.
 * Handles: "Ref: Job ID: 102817", "Job ID: 102817", "REQ-102817", "102817", "#102817"
 */
function parseReference(raw?: string): { prefix: string; code: string } | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Clean leading '#', 'ref:', 'reference:'
  const cleaned = trimmed.replace(/^(#\s*|ref(erence)?[:.\s-]*)/i, "").trim();
  if (!cleaned) return null;

  // Check for common job portal patterns like "Job ID: 102817" or "Req ID: 102817"
  const match = cleaned.match(/^(job\s*id|req\s*id|id|req)[:.\s-]*(.+)$/i);
  if (match) {
    return {
      prefix: match[1].toUpperCase().replace(/\s+/, " "),
      code: match[2].trim(),
    };
  }

  return {
    prefix: "REF",
    code: cleaned,
  };
}

export function CoverLetterCard({
  data,
  showDownloadButton = true,
}: CoverLetterCardProps) {
  const { basics, profiles, recipient, position, content } = data;

  // Resolve avatar URL with fallback support
  const avatarUrl = basics?.picture?.url
    ? withBasePath(basics.picture.url)
    : withBasePath("/images/profile.webp");

  const initials = (basics?.name || "Candidate")
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Profile links
  const linkedinProfile = profiles?.find(
    (p) => p.network?.toLowerCase() === "linkedin"
  );
  const githubProfile = profiles?.find(
    (p) => p.network?.toLowerCase() === "github"
  );

  // Parse modern reference badge
  const refBadge = parseReference(position?.referenceNumber);

  // Determine which sections have valid content to prevent rendering empty blocks/dividers
  const hasContactInfo = Boolean(
    basics?.location ||
    basics?.email ||
    basics?.phone ||
    basics?.url?.href ||
    linkedinProfile?.url?.href ||
    githubProfile?.url?.href
  );

  const hasRecipientInfo = Boolean(
    recipient?.company ||
    recipient?.department ||
    recipient?.contactPerson ||
    recipient?.city ||
    recipient?.country
  );

  const hasPositionCard = Boolean(
    position?.title ||
    refBadge ||
    recipient?.company ||
    recipient?.department
  );

  const hasMetaRow = Boolean(recipient?.company || recipient?.department);

  const signOff = content?.signOffName || basics?.name;
  const hasSignOff = Boolean(content?.closing || signOff);

  const safeFilename = `Cover_Letter_${(basics?.name || "Candidate").replace(/\s+/g, "_")}_${(recipient?.company || position?.title || "Application").replace(/\s+/g, "_")}`;

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
            {basics?.name && (
              <h1 className="text-4xl font-extrabold tracking-tight mb-1 mt-0 leading-none">
                {basics.name}
              </h1>
            )}
            {basics?.headline && (
              <p className="text-lg font-medium opacity-80 mb-2">
                {basics.headline}
              </p>
            )}
            {position?.title && (
              <div className="text-sm font-semibold text-primary">
                Application for: {position.title}
              </div>
            )}
          </div>

          {/* LEFT COLUMN: Sidebar Container */}
          <aside className="p-4 pr-0 print:p-4 print:pr-0 print:h-full bg-white dark:bg-zinc-950">
            <div className="bg-zinc-900 text-zinc-100 p-6 md:p-8 flex flex-col justify-between print:!flex print:p-6 print:h-full dark:bg-white dark:text-zinc-900 h-full rounded-2xl">
              <div className="flex flex-col items-center gap-6">
                {/* 1. Avatar (With clean fallback if image is missing) */}
                <Avatar className="h-40 w-40 lg:h-44 lg:w-44 group transition-all duration-500 ease-in-out bg-zinc-800 border-4 border-zinc-800 shadow-sm dark:bg-zinc-200 dark:border-zinc-200">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`Profile picture of ${basics?.name || "Candidate"}`}
                      fill
                      sizes="(max-width: 1024px) 160px, 176px"
                      priority
                      className="object-cover object-top scale-[1.2] origin-bottom translate-y-4 transition-transform duration-500 ease-in-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-3xl text-zinc-400 dark:text-zinc-600">
                      {initials}
                    </div>
                  )}
                </Avatar>

                {/* 2. Personal Information & Links (Rendered only when contact details exist) */}
                {hasContactInfo && (
                  <section className="w-full">
                    <h3 className="text-xs font-bold mb-2.5 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b pb-1 border-zinc-800 dark:border-zinc-200">
                      Contact & Profiles
                    </h3>
                    <div className="space-y-2.5 text-xs w-full text-left">
                      {basics?.location && (
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
                      )}

                      {basics?.email && (
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

                      {basics?.phone && (
                        <a
                          href={`tel:${basics.phone.replace(/[\s()+-]/g, "")}`}
                          className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors justify-start dark:text-zinc-700 dark:hover:text-black"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                          <span>{basics.phone}</span>
                        </a>
                      )}

                      {basics?.url?.href && (
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
                )}
              </div>

              {/* 3. Recipient Section (Rendered only when recipient information is provided) */}
              {hasRecipientInfo && (
                <section className="w-full pt-4 border-t border-zinc-800 dark:border-zinc-200">
                  <h3 className="text-xs font-bold mb-2 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Recipient
                  </h3>
                  <div className="text-xs space-y-1.5 text-zinc-300 dark:text-zinc-700">
                    {recipient?.company && (
                      <div className="font-semibold text-zinc-100 dark:text-zinc-900 flex items-start gap-1.5">
                        <Building className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5" />
                        <span className="leading-snug break-words">{recipient.company}</span>
                      </div>
                    )}
                    {recipient?.department && (
                      <div className="opacity-80 pl-5 leading-snug break-words text-[11px]">
                        {recipient.department}
                      </div>
                    )}
                    {recipient?.contactPerson && (
                      <div className="opacity-80 pl-5 leading-snug break-words text-[11px]">
                        {recipient.contactPerson}
                      </div>
                    )}
                    {(recipient?.city || recipient?.country) && (
                      <div className="opacity-70 pl-5 leading-snug break-words text-[11px]">
                        {[recipient?.city, recipient?.country].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </aside>

          {/* RIGHT COLUMN: Cover Letter Content */}
          <div className="bg-white text-zinc-900 px-6 py-6 md:px-8 md:py-8 print:px-6 print:py-6 dark:bg-zinc-950 dark:text-zinc-100 h-full flex flex-col justify-between print:h-full print:box-border">
            <div className="flex flex-col h-full justify-between">
              <div>
                {/* Document Date: Placed top-right, applying generally to the entire letter */}
                {position?.date && (
                  <div className="flex justify-end mb-2.5">
                    <time className="text-xs text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
                      {position.date}
                    </time>
                  </div>
                )}

                {/* Target Position Banner on Top (Rendered only if position data exists) */}
                {hasPositionCard && (
                  <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                    {/* Card Header: Application label on left, Modern Ref ID badge on right */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Application for Position
                      </span>

                      {/* Modern Reference ID Badge */}
                      {refBadge && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-mono text-[11px] font-medium bg-zinc-200/70 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-300/60 dark:border-zinc-700/60 shrink-0">
                          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            {refBadge.prefix}:
                          </span>
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {refBadge.code}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Position Title */}
                    {position?.title && (
                      <h2 className="text-xl md:text-2xl font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight break-words leading-snug">
                        {position.title}
                      </h2>
                    )}

                    {/* Company & Department / Area: Resilient layout where any length wraps gracefully */}
                    {hasMetaRow && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
                        {recipient?.company && (
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 break-words">
                            {recipient.company}
                          </span>
                        )}
                        {recipient?.department && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-700/40 break-words">
                            {recipient.department}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cover Letter Body */}
                <div className="space-y-3.5 text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {content?.salutation && (
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {content.salutation}
                    </p>
                  )}

                  {content?.paragraphs &&
                    content.paragraphs.map((paragraph, index) => (
                      <p key={index} className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {paragraph}
                      </p>
                    ))}

                  {/* Optional Scannable Bullet Points */}
                  {content?.bulletPoints && content.bulletPoints.length > 0 && (
                    <div className="my-3 space-y-2 pl-2">
                      {content.bulletPoints.map((bullet, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100 mt-2 shrink-0" />
                          <span className="leading-relaxed">{bullet}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sign-off & Signature: Clean, single name, only rendered if closing/name present */}
              {hasSignOff && (
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                  {content?.closing && (
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      {content.closing}
                    </p>
                  )}
                  {signOff && (
                    <p className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                      {signOff}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
