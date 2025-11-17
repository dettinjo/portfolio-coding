import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de"] as const,
  defaultLocale: "en",

  // --- THIS IS THE FIX ---
  // Change 'never' to 'as-needed'.
  // This will use "/" for 'en' (default) and "/de" for 'de'.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

export function isValidLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
