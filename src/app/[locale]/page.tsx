import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { CollectionPage, WithContext } from "schema-dts";
import { SoftwareHeader } from "@/components/layout/SoftwareHeader";
import { Footer } from "@/components/layout/Footer";
import { ContactSection } from "@/components/sections/ContactSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ResumeCTASection } from "@/components/sections/ResumeCTASection";
import { ScrollIndicator } from "@/components/ScrollIndicator";
import { BackToTopButton } from "@/components/ui/BackToTopButton";
import { fetchSoftwareProjects, fetchSkillCategories } from "@/lib/payload";

type Props = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale: locale,
    namespace: "software.SoftwarePageSEO",
  });

  const fullName = process.env.NEXT_PUBLIC_FULL_NAME || "Developer";
  const firstName = fullName.split(" ")[0];
  const siteTitle = t("siteName", { name: firstName });

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";

  return {
    title: siteTitle,
    description: t("description"),
    openGraph: {
      title: siteTitle,
      description: t("description"),
      url: `${serverUrl}`,
      siteName: siteTitle,
      images: [
        {
          url: `${serverUrl}/og-software.png`,
          width: 1200,
          height: 630,
          alt: `An overview of software projects by ${fullName}`,
        },
      ],
      type: "website",
      locale: locale,
    },
    alternates: {
      canonical: `${serverUrl}`,
      languages: {
        en: `${serverUrl}`,
        de: `${serverUrl}/de`,
        "x-default": `${serverUrl}`,
      },
    },
  };
}

export default async function DevPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = await fetchSoftwareProjects(locale);
  const skillCategories = await fetchSkillCategories(locale);

  const projectsData = projects;
  const skillsDataForDisplay = skillCategories;
  // const projectsData: any[] = [];
  // const skillsDataForDisplay: any[] = [];

  const t = await getTranslations({
    locale: locale,
    namespace: "software.SoftwareProjectsSection",
  });

  const skillsForDisplay = skillsDataForDisplay
    ? skillsDataForDisplay
        .filter((cat) => cat && Array.isArray(cat.skills))
        .map((cat) => ({
          category: cat.name,
          skills: [...cat.skills].sort((a, b) => b.level - a.level),
        }))
    : null;

  const cleanProjectsData = projectsData ? projectsData.filter(Boolean) : null;

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || "";

  const jsonLd: WithContext<CollectionPage> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("subtitle"),
    url: `${serverUrl}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: (cleanProjectsData || []).map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: project.title,
        url: `${serverUrl}/${project.slug}`,
      })),
    },
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <SoftwareHeader showNavLinks={true} />
      <main className="flex-1">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <HeroSection />
        <div className="max-w-6xl mx-auto px-6">
          <div className="py-24">
            <ProjectsSection projects={cleanProjectsData} />
          </div>
          <ScrollIndicator href="#skills" />
          <div className="py-24">
            <SkillsSection skills={skillsForDisplay} />
          </div>
          <div className="py-12">
            <ScrollIndicator href="#resume-cta" />
          </div>
          <ResumeCTASection />
          <ScrollIndicator href="#kontakt" />
          <div className="pt-24 pb-64 md:pb-96">
            <ContactSection />
          </div>
        </div>
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
