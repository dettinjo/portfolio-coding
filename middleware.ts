import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

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
  // - images (Your static images folder) <--- THIS IS THE FIX
  // - favicon* (Favicons)
  // - files with extensions (e.g. .png, .jpg, .css, .js) <--- ADDS ROBUSTNESS
  matcher: ["/((?!api|_next|_vercel|images|favicon*|.*\\..*).*)"],
};
