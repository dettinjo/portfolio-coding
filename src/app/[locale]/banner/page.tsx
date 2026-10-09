import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LinkedInBannerGenerator } from "@/components/banner/LinkedInBannerGenerator";
import { siteConfig } from "@/lib/config";

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

  return <LinkedInBannerGenerator locale={locale} />;
}
