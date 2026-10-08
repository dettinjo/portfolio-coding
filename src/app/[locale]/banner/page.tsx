import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { Footer } from "@/components/layout/Footer";
import { LinkedInBannerGenerator } from "@/components/banner/LinkedInBannerGenerator";
import { siteConfig } from "@/lib/config";
import { Terminal } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BannerPage" });
  return {
    title: `${t("title")} - ${siteConfig.person.fullName}`,
    description: t("subtitle"),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function BannerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("BannerPage");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <UtilityHeader />

      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col justify-center">
        {/* Compact Header */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Single-Screen Interactive Studio */}
        <div className="flex-1">
          <LinkedInBannerGenerator locale={locale} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
