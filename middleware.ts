// middleware.ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

// Use the standard next-intl middleware
export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

export const config = {
  // Match all paths except for
  // - …api (API routes)
  // - …_next/static (static files)
  // - …_next/image (image optimization files)
  // - …favicon* (favicon files)
  matcher: ["/((?!api|_next/static|_next/image|favicon*).*)"],
};
