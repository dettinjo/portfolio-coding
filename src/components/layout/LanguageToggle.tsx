// src/components/layout/LanguageToggle.tsx
"use client";

import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import React from "react";
// --- ADD THIS IMPORT BACK ---
import { useAlternateLinks } from "@/context/AlternateLinksProvider";

export function LanguageToggle() {
  const currentLocale = useLocale();
  // --- ADD THIS HOOK BACK ---
  const { alternateSlugs } = useAlternateLinks();
  const nextLocale = currentLocale === "de" ? "en" : "de";

  const handleLanguageSwitch = () => {
    // --- THIS IS THE CORRECT LOGIC ---
    const isLocal = window.location.hostname === "localhost";
    const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN || "";

    // Find the correct path for the new language (e.g., /mein-projekt or just /)
    const alternatePath =
      alternateSlugs && alternateSlugs[nextLocale]
        ? alternateSlugs[nextLocale]
        : "/";

    // 1. Set the cookie
    const date = new Date();
    date.setTime(date.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    const expires = `expires=${date.toUTCString()}`;

    let cookieString = `NEXT_LOCALE=${nextLocale};${expires};path=/`;

    if (!isLocal) {
      // Set domain attribute for production so subdomains can read it
      cookieString += `;domain=.${softwareDomain}`;
    }

    document.cookie = cookieString;

    // 2. Handle the redirect
    if (isLocal) {
      // On localhost, just reload. Middleware will read the new cookie.
      window.location.reload();
    } else {
      // On production, redirect to the correct subdomain + slug
      let newUrl = "";
      if (nextLocale === "de") {
        newUrl = `https://de.${softwareDomain}${alternatePath}`;
      } else {
        newUrl = `https://${softwareDomain}${alternatePath}`;
      }
      window.location.href = newUrl;
    }
    // --- END ---
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLanguageSwitch}
      aria-label={`Switch language to ${nextLocale.toUpperCase()}`}
    >
      <span className="text-sm font-semibold">
        {currentLocale.toUpperCase()}
      </span>
    </Button>
  );
}
