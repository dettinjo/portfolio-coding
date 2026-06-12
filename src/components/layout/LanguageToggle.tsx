// src/components/layout/LanguageToggle.tsx
"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import React from "react";
// --- FIX: Import the correct hooks ---
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { useAlternateLinks } from "@/context/AlternateLinksProvider";
import { useUmami } from "@/hooks/useUmami";

export function LanguageToggle() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { track } = useUmami();

  const { alternateSlugs } = useAlternateLinks();

  const nextLocale = currentLocale === "de" ? "en" : "de";

  const handleLanguageSwitch = () => {
    track("language_switched", { from: currentLocale, to: nextLocale });
    startTransition(() => {
      // scroll:false keeps the reader where they are — switching language
      // shouldn't yank them back to the top of the page.
      if (alternateSlugs && alternateSlugs[nextLocale]) {
        router.replace(alternateSlugs[nextLocale], { locale: nextLocale, scroll: false });
      } else {
        router.replace(pathname, { locale: nextLocale, scroll: false });
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLanguageSwitch}
      disabled={isPending}
      aria-label={`Switch language to ${nextLocale.toUpperCase()}`}
    >
      <span className="text-sm font-semibold">
        {currentLocale.toUpperCase()}
      </span>
    </Button>
  );
}
