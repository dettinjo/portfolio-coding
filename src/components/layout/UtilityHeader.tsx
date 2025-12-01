"use client";

import { useLocale } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Link } from "@/i18n/navigation";
import { Terminal } from "lucide-react";

export function UtilityHeader() {
  const locale = useLocale();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <nav className="container mx-auto flex h-14 items-center justify-between">
        <Link
          href="/"
          locale={locale}
          aria-label="Zurück zur Startseite"
          className="transition-opacity hover:opacity-80"
        >
          <Terminal className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
