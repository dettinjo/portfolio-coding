import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import personalConfig from "@/data/personal.json";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "PrivacyPage" });
  return { title: t("title") };
}

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("PrivacyPage");

  const values = {
    name: process.env.NEXT_PUBLIC_FULL_NAME || personalConfig.fullName,
    street: process.env.NEXT_PUBLIC_STREET_ADDRESS || "",
    city: process.env.NEXT_PUBLIC_CITY_ADDRESS || "",
    email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || personalConfig.contactEmail,
  };

  const section2Content = [
    t("section2_content.name", values),
    t("section2_content.street", values),
    t("section2_content.city", values),
    t("section2_content.email", values),
  ];

  return (
    <div className="container mx-auto max-w-4xl py-16 px-4">
      <h1 className="text-4xl font-bold border-b-2 border-foreground pb-4">
        {t("title")}
      </h1>
      <div className="mt-8 space-y-8 text-muted-foreground">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{t("section1_title")}</h2>
          <p>{t("section1_content")}</p>
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{t("section2_title")}</h2>
          {section2Content.map((line: string, index: number) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div>
          <h2 className="text-2xl font-semibold">{t("section3_title")}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                {t("section3_hosting_title")}
              </h3>
              <p>{t("section3_hosting_content")}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {t("section3_tracking_title")}
              </h3>
              <p>{t("section3_tracking_content")}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {t("section3_contact_title")}
              </h3>
              <p>{t("section3_contact_content")}</p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{t("section4_title")}</h2>
          <p>{t("section4_content")}</p>
        </div>
      </div>
    </div>
  );
}
