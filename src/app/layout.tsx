// src/app/layout.tsx

import "./globals.css";
import "devicon/devicon.min.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/Theme-Provider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

// --- SEO ENHANCEMENT ---
export const metadata: Metadata = {
  title: {
    template: "%s",
    // --- THIS IS THE FIX ---
    default: "Software Portfolio",
  },
  // --- THIS IS THE FIX ---
  description: "A personal portfolio showcasing software development projects.",
  alternates: {
    // --- THIS IS THE FIX ---
    canonical: `https://${process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN}`,
    languages: {
      en: `https://${process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN}`,
      de: `https://de.${process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN}`,
      "x-default": `https://${process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN}`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
