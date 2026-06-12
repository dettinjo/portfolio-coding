// Dynamic technology resolver.
//
// Icons are resolved automatically from devicon's bundled manifest (devicon.json,
// ~580 technologies) by punctuation-insensitive name/alias matching — so any tech
// gets an icon without a manual entry. tech-registry.json is an OPTIONAL override
// layered on top, used only to supply a homepage URL or a custom category/name
// (devicon provides neither). Unknown techs degrade gracefully: icon if devicon
// has one, no link, default category.

import deviconData from "devicon/devicon.json";
import registryData from "@/data/tech-registry.json";

export interface TechDetail {
  name: string;
  iconClassName: string | null;
  url: string | null;
  category: string;
  color?: string | null;
}

interface DeviconEntry {
  name: string;
  altnames?: string[];
  tags?: string[];
  versions?: { svg?: string[]; font?: string[] };
  color?: string;
}

interface RegistryEntry {
  name: string;
  category: string;
  iconClassName: string | null;
  url: string | null;
}

const devicon = deviconData as unknown as DeviconEntry[];
const registry = registryData as unknown as Record<string, RegistryEntry>;

export const normalizeTech = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");

const prettify = (s: string): string =>
  s
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// devicon font class: prefer the monochrome "plain" variant (respects theme),
// then "original", then whatever font version exists.
const deviconClass = (e: DeviconEntry): string | null => {
  const fonts = e.versions?.font ?? [];
  if (fonts.length === 0) return null;
  const v = fonts.includes("plain")
    ? "plain"
    : fonts.includes("original")
      ? "original"
      : fonts[0];
  return `devicon-${e.name}-${v}`;
};

// Preferred SVG variant name for cover icons — colored "original" looks best.
export const deviconSvgVariant = (e: DeviconEntry): string | null => {
  const svgs = e.versions?.svg ?? [];
  if (svgs.length === 0) return null;
  return svgs.includes("original")
    ? "original"
    : svgs.includes("plain")
      ? "plain"
      : svgs[0];
};

const deviconByNorm: Record<string, DeviconEntry> = {};
for (const e of devicon) {
  deviconByNorm[normalizeTech(e.name)] = e;
  for (const a of e.altnames ?? []) deviconByNorm[normalizeTech(a)] = e;
}

const registryByNorm: Record<string, RegistryEntry> = {};
for (const [key, val] of Object.entries(registry)) {
  registryByNorm[normalizeTech(key)] = val;
  if (val.name) registryByNorm[normalizeTech(val.name)] = val;
}

export const lookupDevicon = (raw: string): DeviconEntry | undefined =>
  deviconByNorm[normalizeTech(raw)];

// Resolve a tag/tech name to display details. Registry override wins; devicon
// fills in the icon (and name/color); sensible fallbacks otherwise.
export const resolveTech = (raw: string): TechDetail => {
  const ov = registryByNorm[normalizeTech(raw)];
  const dev = deviconByNorm[normalizeTech(raw)];
  return {
    name: ov?.name || (dev ? prettify(dev.name) : prettify(raw)),
    iconClassName: ov?.iconClassName ?? (dev ? deviconClass(dev) : null),
    url: ov?.url ?? null,
    category: ov?.category ?? "backend",
    color: dev?.color ?? null,
  };
};
