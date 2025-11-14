import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isValidLocale, routing } from "./routing";

export default getRequestConfig(async () => {
  let locale = (await cookies()).get("NEXT_LOCALE")?.value;
  if (!locale) {
    const acceptLanguage = (await headers()).get("accept-language");
    if (acceptLanguage) {
      const primaryLanguage = acceptLanguage.split(",")[0].split("-")[0];
      if (isValidLocale(primaryLanguage)) {
        locale = primaryLanguage;
      }
    }
  }
  if (!locale || !isValidLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      ...(await import(`../../messages/${locale}/common.json`)).default,
      software: (await import(`../../messages/${locale}/software.json`))
        .default,
    },
  };
});
