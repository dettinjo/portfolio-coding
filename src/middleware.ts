import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  checkRateLimit,
  getClientIp,
  renderRateLimitCliResponse,
} from "./lib/rate-limiter";

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

  // Tier 3: In-app rate limiting per client IP
  const ip = getClientIp(request.headers);
  const rateLimit = checkRateLimit(ip, isCli ? "cli" : "general");

  if (!rateLimit.allowed) {
    if (isCli) {
      return new NextResponse(renderRateLimitCliResponse(rateLimit), {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": String(rateLimit.resetInSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      });
    }

    return new NextResponse(
      "429 Too Many Requests: Rate limit exceeded. Please wait a moment before trying again.",
      {
        status: 429,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Retry-After": String(rateLimit.resetInSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  if (isCli) {
    const cliUrl = new URL("/api/cli", request.url);
    cliUrl.searchParams.set("cli_path", pathname);

    // Forward existing search parameters
    request.nextUrl.searchParams.forEach((val, key) => {
      if (key !== "cli_path") {
        cliUrl.searchParams.set(key, val);
      }
    });

    const response = NextResponse.rewrite(cliUrl);
    response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
    response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
    return response;
  }

  const response = intlMiddleware(request);
  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  return response;
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
