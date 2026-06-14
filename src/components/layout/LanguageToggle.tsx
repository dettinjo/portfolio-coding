// src/components/layout/LanguageToggle.tsx
"use client";

import React, { useTransition } from "react";
import { useLocale } from "next-intl";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAlternateLinks } from "@/context/AlternateLinksProvider";
import { useUmami } from "@/hooks/useUmami";
import { routing, localeNames, Locale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const { track } = useUmami();

  const { alternateSlugs } = useAlternateLinks();

  const handleLanguageSwitch = (targetLocale: Locale) => {
    if (targetLocale === currentLocale) return;
    track("language_switched", { from: currentLocale, to: targetLocale });
    startTransition(() => {
      // scroll:false keeps the reader where they are — switching language
      // shouldn't yank them back to the top of the page.
      if (alternateSlugs && alternateSlugs[targetLocale]) {
        router.replace(alternateSlugs[targetLocale], { locale: targetLocale, scroll: false });
      } else {
        router.replace(pathname, { locale: targetLocale, scroll: false });
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          aria-label="Select language"
        >
          <span className="text-sm font-semibold">
            {currentLocale.toUpperCase()}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleLanguageSwitch(loc)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{localeNames[loc]}</span>
            {currentLocale === loc && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
