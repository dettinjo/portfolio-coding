import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { isValidLocale, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
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
