import React from "react";
import { NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { routing, isValidLocale } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Imports from old src/app/layout.tsx
import "../globals.css";
import "devicon/devicon.min.css";
// import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/Theme-Provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
      icon: "/favicon.ico",
      shortcut: { url: "/favicon.ico", type: "image/x-icon" },
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

  return (
    // --- THIS IS THE FIX ---
    // Changed suppressHydWarning to suppressHydrationWarning
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased"
          // inter.className
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: process.env.NEXT_PUBLIC_FULL_NAME || "Portfolio",
              url:
                process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
