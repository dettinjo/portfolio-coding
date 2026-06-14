"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { withBasePath } from "@/lib/basePath";

export function useResumeDownload() {
  const locale = useLocale();

  const downloadResume = useCallback(() => {
    if (typeof window === "undefined") return;
    // Build the localized resume URL correctly: with `as-needed` routing the
    // default locale has no prefix, and a static-export deploy adds a basePath.
    // Opening /resume?print=true triggers the page's auto-print (ResumeAutoPrint).
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    window.open(withBasePath(`${prefix}/resume?print=true`), "_blank");
  }, [locale]);

  return { downloadResume };
}
