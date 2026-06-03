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
  const fullName = process.env.NEXT_PUBLIC_FULL_NAME || "Portfolio";
  const firstName = fullName.split(" ")[0];

  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";

  return {
    title: t("title", { name: firstName }),
    description: t("description", { name: firstName }),
    metadataBase: new URL(serverUrl),
    icons: {
      apple: { url: "/favicon-light.svg", type: "image/svg+xml" },
      other: [
        {
          rel: "icon",
          url: "/favicon-light.svg",
          media: "(prefers-color-scheme: light)",
          type: "image/svg+xml",
        },
        {
          rel: "icon",
          url: "/favicon-dark.svg",
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

  // Umami analytics — read at request time from runtime env vars so the
  // website ID can be changed in Coolify without triggering a rebuild.
  const umamiScriptUrl = process.env.UMAMI_SCRIPT_URL;
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
              name: process.env.NEXT_PUBLIC_FULL_NAME || "Portfolio",
              url: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        {umamiScriptUrl && umamiWebsiteId && (
          <Script
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
