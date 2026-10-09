import { NextRequest } from "next/server";
import {
  renderFullPortfolio,
  renderProjectsSubroute,
  renderProjectDetail,
  renderSkillsSubroute,
  renderResumeSubroute,
  renderContactSubroute,
  renderJsonSummary,
  CliRenderOptions,
} from "@/lib/cli/formatter";
import { stripAnsi } from "@/lib/cli/ansi";
import projectsData from "@/data/projects.json";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const rawPath = url.searchParams.get("cli_path") || url.pathname || "/";

  // Clean language prefixes (e.g. /de/projects -> /projects) and remove trailing slash
  let cleanPath = rawPath.replace(/^\/(?:en|de|es)(?=\/|$)/, "");
  if (!cleanPath.startsWith("/")) {
    cleanPath = `/${cleanPath}`;
  }
  if (cleanPath.length > 1 && cleanPath.endsWith("/")) {
    cleanPath = cleanPath.slice(0, -1);
  }

  // Detect language: query param > path prefix > accept-language header
  let lang: "en" | "de" = "en";
  const langParam = url.searchParams.get("lang");
  if (langParam === "de" || rawPath.startsWith("/de")) {
    lang = "de";
  } else if (!langParam) {
    const acceptLang = request.headers.get("accept-language") || "";
    if (acceptLang.toLowerCase().startsWith("de")) {
      lang = "de";
    }
  }

  // Detect output options
  const isPlain =
    url.searchParams.get("plain") === "1" ||
    url.searchParams.get("plain") === "true" ||
    request.headers.get("no-color") !== null;

  const isJson =
    url.searchParams.get("json") === "1" ||
    url.searchParams.get("format") === "json" ||
    request.headers.get("accept")?.includes("application/json") ||
    false;

  // Determine origin URL for links
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host;
  const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const options: CliRenderOptions = {
    lang,
    isPlain,
    origin,
  };

  // Return structured JSON if requested
  if (isJson) {
    return new Response(renderJsonSummary(options), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "Vary": "User-Agent, Accept, Accept-Language",
      },
    });
  }

  let output = "";

  // Check if path is a project slug
  const projectSlugs = (projectsData as Array<{ slug: string }>).map((p) => p.slug.toLowerCase());
  const potentialSlug = cleanPath.replace(/^\//, "").toLowerCase();

  if (cleanPath === "/" || cleanPath === "/cli" || cleanPath === "/api/cli") {
    output = renderFullPortfolio(options);
  } else if (cleanPath === "/projects") {
    output = renderProjectsSubroute(options);
  } else if (cleanPath === "/skills") {
    output = renderSkillsSubroute(options);
  } else if (cleanPath === "/resume" || cleanPath === "/cv") {
    output = renderResumeSubroute(options);
  } else if (cleanPath === "/contact") {
    output = renderContactSubroute(options);
  } else if (projectSlugs.includes(potentialSlug)) {
    output = renderProjectDetail(potentialSlug, options);
  } else {
    // Default fallback
    output = renderFullPortfolio(options);
  }

  // Strip ANSI color codes if plain text was requested
  if (isPlain) {
    output = stripAnsi(output);
  }

  return new Response(output, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "Vary": "User-Agent, Accept, Accept-Language",
    },
  });
}
