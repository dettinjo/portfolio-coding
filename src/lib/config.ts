// Single accessor for all personalization. Reads the generated
// src/data/site.config.json (produced at build time by scripts/fetch-portfolio.ts
// from the portfolio-config repo, a local config/site.config.json, or the
// committed config/site.config.example.json fallback) and normalizes it into a
// fully-populated, typed SiteConfig. Safe to import in both server and client
// components — it contains only public information.

import rawConfig from "@/data/site.config.json";
import type { SiteConfig } from "./types";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const normalize = (raw: DeepPartial<SiteConfig>): SiteConfig => {
  const person = raw.person ?? {};
  const site = raw.site ?? {};
  const legal = raw.legal ?? {};
  const contact = raw.contact ?? {};

  const fullName = person.fullName?.trim() || "Portfolio";
  const firstName = person.firstName?.trim() || fullName.split(" ")[0];

  return {
    person: {
      fullName,
      firstName,
      headline: person.headline ?? "Software Engineer",
      email: person.email ?? "",
      phone: person.phone ?? "",
      address: {
        street: person.address?.street ?? "",
        city: person.address?.city ?? "",
        country: person.address?.country ?? "",
      },
      socials: {
        github: person.socials?.github ?? "",
        linkedin: person.socials?.linkedin ?? "",
        instagram: person.socials?.instagram ?? "",
      },
    },
    site: {
      serverUrl: site.serverUrl ?? "http://localhost:3000",
      defaultLocale: site.defaultLocale ?? "en",
      seo: {
        description: {
          en: site.seo?.description?.en ?? "",
          de: site.seo?.description?.de ?? site.seo?.description?.en ?? "",
        },
      },
    },
    legal: {
      hosting: {
        provider: legal.hosting?.provider ?? "",
        address: legal.hosting?.address ?? "",
      },
      analytics: {
        tool: legal.analytics?.tool ?? "",
        domain: legal.analytics?.domain ?? "",
        cookieless: legal.analytics?.cookieless ?? true,
      },
    },
    contact: {
      smtpFrom: contact.smtpFrom ?? person.email ?? "",
    },
  };
};

export const siteConfig: SiteConfig = normalize(rawConfig as DeepPartial<SiteConfig>);
