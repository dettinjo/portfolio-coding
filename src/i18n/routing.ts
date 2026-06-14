import { defineRouting } from "next-intl/routing";
import rawConfig from "@/data/site.config.json";

interface RawConfig {
  site?: {
    defaultLocale?: string;
    locales?: string[];
  };
}

const typedRawConfig = rawConfig as RawConfig;

export const routing = defineRouting({
  locales: typedRawConfig.site?.locales || ["en", "de"],
  defaultLocale: typedRawConfig.site?.defaultLocale || "en",

  // --- THIS IS THE FIX ---
  // Change 'never' to 'as-needed'.
  // This will use "/" for 'en' (default) and "/de" for 'de'.
  localePrefix: "as-needed",
});

export type Locale = string;

export const localeNames: Record<string, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
};

export function isValidLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
