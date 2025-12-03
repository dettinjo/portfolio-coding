import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Use the standard next-intl middleware
export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

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
