import React from "react";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing, isValidLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Metadata } from "next";

import "../globals.css";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import { withBasePath } from "@/lib/basePath";
import { ThemeProvider } from "@/components/Theme-Provider";
// const inter = Inter({ subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HomePageSEO" });
  const firstName = siteConfig.person.firstName;

  const serverUrl = siteConfig.site.serverUrl;

  return {
    title: t("title", { name: firstName }),
    description: t("description", { name: firstName }),
    metadataBase: new URL(serverUrl),
    icons: {
      apple: { url: withBasePath("/favicon-light.svg"), type: "image/svg+xml" },
      other: [
        {
          rel: "icon",
          url: withBasePath("/favicon-light.svg"),
          media: "(prefers-color-scheme: light)",
          type: "image/svg+xml",
        },
        {
          rel: "icon",
          url: withBasePath("/favicon-dark.svg"),
          media: "(prefers-color-scheme: dark)",
          type: "image/svg+xml",
        },
      ],
    },
    alternates: {
      canonical: locale === "de" ? `${serverUrl}/de` : `${serverUrl}`,
      languages: {
        en: `${serverUrl}`,
        de: `${serverUrl}/de`,
        "x-default": `${serverUrl}`,
      },
    },
  };
}

export default async function RootLocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  // Umami analytics — website ID is the only runtime var needed.
  // The script is served through /api/umami (proxied to the internal Umami
  // instance) so no public Umami domain is required.
  const umamiWebsiteId = process.env.UMAMI_WEBSITE_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: siteConfig.person.fullName,
              url: siteConfig.site.serverUrl,
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        {umamiWebsiteId && (
          <Script
            src="/api/sys-client"
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
