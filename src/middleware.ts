import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

// Standard next-intl middleware
const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

export default function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
  const accept = request.headers.get("accept")?.toLowerCase() || "";
  const pathname = request.nextUrl.pathname;

  const hasCliParam =
    request.nextUrl.searchParams.has("cli") ||
    request.nextUrl.searchParams.get("format") === "cli" ||
    request.nextUrl.searchParams.get("format") === "text";

  const isCli =
    /^(curl|wget|httpie|fetch|libcurl)/i.test(userAgent) ||
    hasCliParam ||
    pathname === "/cli" ||
    (accept.includes("text/plain") && !accept.includes("text/html"));

  if (isCli) {
    const cliUrl = new URL("/api/cli", request.url);
    cliUrl.searchParams.set("cli_path", pathname);

    // Forward existing search parameters
    request.nextUrl.searchParams.forEach((val, key) => {
      if (key !== "cli_path") {
        cliUrl.searchParams.set(key, val);
      }
    });

    return NextResponse.rewrite(cliUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all paths except for:
  // - api (API routes)
  // - _next (Next.js internals)
  // - _vercel (Vercel internals)
  // - admin (Payload admin UI)
  // - images (Your static images folder)
  // - favicon* (Favicons)
  // - files with extensions (e.g. .png, .jpg, .css, .js)
  matcher: ["/((?!api|_next|_vercel|admin|images|favicon*|.*\\..*).*)"],
};
