import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UtilityHeader } from "@/components/layout/UtilityHeader";
import { Footer } from "@/components/layout/Footer";
import { LinkedInBannerGenerator } from "@/components/banner/LinkedInBannerGenerator";
import { siteConfig } from "@/lib/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Monitor, Smartphone, Palette, Code2 } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BannerPage" });
  return {
    title: `${t("title")} - ${siteConfig.person.fullName}`,
    description: t("subtitle"),
  };
}

export default async function BannerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("BannerPage");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <UtilityHeader />

      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl space-y-16">
        {/* Header Section */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            <Palette className="h-3.5 w-3.5" />
            <span>Developer Portfolio Branding Studio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
            {t("title")}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Interactive Banner Studio */}
        <LinkedInBannerGenerator locale={locale} />

        {/* ─── RESEARCH & SPECIFICATIONS DEEP-DIVE ───────────────────────────── */}
        <section className="space-y-8 pt-8 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                {t("researchTitle")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("researchIntro")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spec 1: Official Dimensions */}
            <Card className="bg-card/60 backdrop-blur-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    4:1 Aspect Ratio
                  </Badge>
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold pt-2">
                  {t("specDimensionsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {t("specDimensionsDesc")}
              </CardContent>
            </Card>

            {/* Spec 2: Desktop Avatar Collision */}
            <Card className="bg-card/60 backdrop-blur-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono text-red-500 border-red-500/30">
                    Safe Margin: 340px
                  </Badge>
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold pt-2">
                  {t("specDesktopSafeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {t("specDesktopSafeDesc")}
              </CardContent>
            </Card>

            {/* Spec 3: Mobile Viewport Cropping */}
            <Card className="bg-card/60 backdrop-blur-sm border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono text-amber-500 border-amber-500/30">
                    1260 × 316 px
                  </Badge>
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold pt-2">
                  {t("specMobileSafeTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                {t("specMobileSafeDesc")}
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
