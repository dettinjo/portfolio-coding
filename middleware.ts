// middleware.ts

import { NextRequest, NextResponse } from "next/server";
import { routing, isValidLocale } from "./src/i18n/routing";

// Get the domain name from your environment variables
const SOFTWARE_DOMAIN = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN || "";

// A helper function to determine the user's preferred language
function getLocale(request: NextRequest): string {
  // 1. Check for a manual choice from the language toggle cookie
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2. If no cookie, check the `Accept-Language` header for the first visit
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const primaryLanguage = acceptLanguage.split(",")[0].split("-")[0];
    if (isValidLocale(primaryLanguage)) {
      return primaryLanguage;
    }
  }

  // 3. Fallback to the default if no other language is found
  return routing.defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for Next.js internal files and static assets
  if (pathname.startsWith("/_next") || /\..*$/.test(pathname)) {
    return NextResponse.next();
  }

  // --- NEW SIMPLIFIED ROUTING LOGIC ---

  // 1. Determine the user's locale (e.g., 'de' or 'en')
  const locale = getLocale(request);

  // 2. Rewrite the request to the internal, locale-prefixed path.
  // e.g., /about -> /en/about
  const finalPath = `/${locale}${pathname}`;

  // 3. Rewrite the request to the final, internal path.
  return NextResponse.rewrite(new URL(finalPath, request.url));
}

export const config = {
  // Match all paths to give the middleware full control
  matcher: "/((?!api|_next/static|_next/image|favicon*).*)",
};
