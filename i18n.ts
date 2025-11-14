import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

const locales = ["en", "de"];

export default getRequestConfig(async ({ locale }) => {
  const baseLocale = locale as any;
  if (!locales.includes(baseLocale)) {
    notFound();
  }
  return {
    locale: baseLocale,
    messages: {
      ...(await import(`./messages/${baseLocale}/common.json`)).default,
      software: (await import(`./messages/${baseLocale}/software.json`))
        .default,
    },
  };
});
