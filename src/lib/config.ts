// Single accessor for all personalization. Reads the generated
// src/data/site.config.json (produced at build time by scripts/fetch-portfolio.ts
// from the portfolio-config repo, a local config/site.config.json, or the
// committed config/site.config.example.json fallback) and normalizes it into a
// fully-populated, typed SiteConfig. Safe to import in both server and client
// components — it contains only public information.

import rawConfig from "@/data/site.config.json";
import type { SiteConfig, BioRotationItem } from "./types";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const DEFAULT_BIO_ROTATIONS: Record<string, BioRotationItem[]> = {
  en: [
    {
      role: "AI Engineer",
      adjectives: ["intelligent", "context-aware", "autonomous"],
      artifacts: "agentic workflows & AI implementations",
    },
    {
      role: "Full-Stack Developer",
      adjectives: ["robust", "scalable", "user-friendly"],
      artifacts: "web applications & cloud platforms",
    },
    {
      role: "Backend Architect",
      adjectives: ["high-throughput", "resilient", "fault-tolerant"],
      artifacts: "distributed microservices & APIs",
    },
    {
      role: "App Developer",
      adjectives: ["fluid", "native", "responsive"],
      artifacts: "cross-platform mobile applications",
    },
  ],
  de: [
    {
      role: "KI-Engineer",
      adjectives: ["intelligente", "kontextsensitive", "autonome"],
      artifacts: "Agentic Workflows & KI-Lösungen",
    },
    {
      role: "Full-Stack Entwickler",
      adjectives: ["robuste", "skalierbare", "benutzerfreundliche"],
      artifacts: "Webanwendungen & Cloud-Plattformen",
    },
    {
      role: "Backend Architekt",
      adjectives: ["hochperformante", "resiliente", "fehlertolerante"],
      artifacts: "verteilte Microservices & APIs",
    },
    {
      role: "App Entwickler",
      adjectives: ["flüssige", "native", "reaktive"],
      artifacts: "Cross-Platform Mobile Apps",
    },
  ],
  es: [
    {
      role: "Ingeniero de IA",
      adjectives: ["inteligentes", "sensibles al contexto", "autónomos"],
      artifacts: "flujos agénticos y soluciones de IA",
    },
    {
      role: "Desarrollador Full-Stack",
      adjectives: ["robustas", "escalables", "fáciles de usar"],
      artifacts: "aplicaciones web y plataformas cloud",
    },
    {
      role: "Arquitecto Backend",
      adjectives: ["de alto rendimiento", "resilientes", "tolerantes a fallos"],
      artifacts: "microservicios distribuidos y APIs",
    },
    {
      role: "Desarrollador de Apps",
      adjectives: ["fluidas", "nativas", "reactivas"],
      artifacts: "aplicaciones móviles multiplataforma",
    },
  ],
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
        email: person.socials?.email ?? person.email ?? "",
        x: person.socials?.x ?? "",
        youtube: person.socials?.youtube ?? "",
        devto: person.socials?.devto ?? "",
        stackoverflow: person.socials?.stackoverflow ?? "",
        ...person.socials,
      },
      hasCustomAvatar: person.hasCustomAvatar ?? false,
      avatarBlurDataUrl: person.avatarBlurDataUrl ?? "",
      bioRotations: (person.bioRotations as Record<string, BioRotationItem[]>) ?? DEFAULT_BIO_ROTATIONS,
      bioRotationInterval: person.bioRotationInterval ?? 4500,
      bioDesignVariant: person.bioDesignVariant ?? "terminal",
    },
    site: {
      serverUrl: site.serverUrl ?? "http://localhost:3000",
      defaultLocale: site.defaultLocale ?? "en",
      locales: (site.locales?.filter((l): l is string => typeof l === "string") ?? ["en", "de"]),
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
