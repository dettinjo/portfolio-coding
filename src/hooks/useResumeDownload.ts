"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";

export function useResumeDownload() {
  const locale = useLocale();

  const downloadResume = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open(`/${locale}/resume?print=true`, "_blank");
    }
  }, [locale]);

  return { downloadResume };
}
