import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import personalConfig from "@/data/personal.json";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ImprintPage" });
  return { title: t("title") };
}

export default async function ImprintPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ImprintPage");

  const values = {
    name: process.env.NEXT_PUBLIC_FULL_NAME || personalConfig.fullName,
    street: process.env.NEXT_PUBLIC_STREET_ADDRESS || "",
    city: process.env.NEXT_PUBLIC_CITY_ADDRESS || "",
    phone: process.env.NEXT_PUBLIC_PHONE_NUMBER || "",
    email: process.env.NEXT_PUBLIC_EMAIL_ADDRESS || personalConfig.contactEmail,
  };

  const section1Content = [
    t("section1_content.name", values),
    t("section1_content.street", values),
    t("section1_content.city", values),
    t("section1_content.country"),
  ];

  const section2Content = [
    t("section2_content.phone", values),
    t("section2_content.email", values),
  ];

  const section3Content = [
    t("section3_content.name", values),
    t("section3_content.address", values),
  ];

  const ContentBlock = ({
    title,
    content,
  }: {
    title: string;
    content: string[];
  }) => (
    <div className="space-y-1">
      <h2 className="text-xl font-semibold">{title}</h2>
      {content.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl py-16 px-4">
      <h1 className="text-4xl font-bold border-b-2 border-foreground pb-4">
        {t("title")}
      </h1>
      <div className="mt-8 space-y-8 text-muted-foreground">
        <ContentBlock title={t("section1_title")} content={section1Content} />
        <ContentBlock title={t("section2_title")} content={section2Content} />
        <ContentBlock title={t("section3_title")} content={section3Content} />
        <div>
          <h2 className="text-2xl font-semibold">{t("disclaimer_title")}</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">
                {t("disclaimer_links_title")}
              </h3>
              <p>{t("disclaimer_links_content")}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {t("disclaimer_copyright_title")}
              </h3>
              <p>{t("disclaimer_copyright_content")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
