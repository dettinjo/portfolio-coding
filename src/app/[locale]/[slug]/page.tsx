import { notFound } from "next/navigation";
import { getTranslations, getFormatter } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, Github } from "lucide-react";
import { ProjectGallery } from "@/components/ProjectGallery";
import { Metadata } from "next";
import { WithContext, SoftwareApplication, BreadcrumbList } from "schema-dts";
import {
  fetchSoftwareProjectBySlug,
  fetchAllProjectSlugs,
  getStrapiMedia,
  getTechDetailsMap,
} from "@/lib/strapi";
import { cn } from "@/lib/utils";
import { LongTextRenderer } from "@/components/LongTextRenderer";
import { AlternateLinksProvider } from "@/context/AlternateLinksProvider";
import { SoftwareHeader } from "@/components/layout/SoftwareHeader";
import { Footer } from "@/components/layout/Footer";

export async function generateStaticParams() {
  const projects = await fetchAllProjectSlugs();
  return projects.map((project) => ({ slug: project.slug }));
}

// UPDATED: 'params' prop is now correctly typed as a Promise.
type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // UPDATED: Await the promise to safely access slug and locale.
  const { slug, locale } = await params;
  const project = await fetchSoftwareProjectBySlug(slug, locale);
  if (!project) return { title: "Project Not Found" };

  const { title, description, coverImage, localizations } = project;
  const imageUrl = getStrapiMedia(coverImage?.url);
  const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN;

  const languages: Record<string, string> = {};
  if (softwareDomain) {
    languages[locale] = `https://${softwareDomain}${
      locale === "de" ? "/de" : ""
    }/${slug}`;
    localizations?.forEach((loc) => {
      languages[loc.locale] = `https://${softwareDomain}${
        loc.locale === "de" ? "/de" : ""
      }/${loc.slug}`;
    });
  }

  return {
    title: title,
    description: description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, alt: `Preview for ${title}` }] : [],
      type: "article",
      locale: locale,
    },
    alternates: {
      canonical: softwareDomain
        ? `https://${softwareDomain}${locale === "de" ? "/de" : ""}/${slug}`
        : undefined,
      languages: languages,
    },
  };
}

// UPDATED: The component now takes 'Props' and awaits 'params'.
export default async function ProjectDetailPage({ params }: Props) {
  // UPDATED: Await the promise to safely access slug and locale.
  const { slug, locale } = await params;

  const [project, techDetailsMap] = await Promise.all([
    fetchSoftwareProjectBySlug(slug, locale),
    getTechDetailsMap(),
  ]);

  if (!project) {
    notFound();
  }

  const alternateSlugs: Record<string, string> = {};
  if (project.localizations) {
    for (const localization of project.localizations) {
      alternateSlugs[localization.locale] = `/${localization.slug}`;
    }
  }

  const t = await getTranslations("software.ProjectDetailsPage");
  const format = await getFormatter({ locale: locale });

  const {
    title,
    description,
    longDescription,
    projectType,
    developedAt,
    liveUrl,
    repoUrl,
    tags,
    coverImage,
    gallery,
  } = project;

  const tagBaseClasses =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none";

  const jsonLd: WithContext<SoftwareApplication> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    applicationCategory: projectType,
    description: description,
    author: {
      "@type": "Person",
      name: process.env.NEXT_PUBLIC_FULL_NAME || "Developer",
    },
  };

  const softwareDomain = process.env.NEXT_PUBLIC_SOFTWARE_DOMAIN;

  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${softwareDomain}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
      },
    ],
  };

  const hasLinks = liveUrl || repoUrl;

  const hasDedicatedGallery = gallery && gallery.length > 1;
  const coverImageSizeKB = coverImage?.size ?? 999;
  const isIcon = !hasDedicatedGallery && coverImageSizeKB < 20;
  const showGallery = !isIcon;

  const galleryImages = showGallery
    ? ((gallery && gallery.length > 0
        ? gallery.map((img) => getStrapiMedia(img.url))
        : [getStrapiMedia(coverImage?.url)]
      ).filter(Boolean) as string[])
    : [];

  let formattedDate = null;
  if (developedAt) {
    const date = new Date(developedAt);
    formattedDate = format.dateTime(date, { year: "numeric", month: "long" });
  }

  return (
    <AlternateLinksProvider value={{ alternateSlugs }}>
      <div className="relative flex min-h-dvh flex-col bg-background">
        <SoftwareHeader showNavLinks={false} />
        <main className="flex-1">
          <article className="max-w-6xl mx-auto py-12 px-6">
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(breadcrumbJsonLd),
              }}
            />
            <Button asChild variant="ghost" className="-ml-4 mb-8">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("back_button")}
              </Link>
            </Button>
            <header>
              <p className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">
                {projectType}
              </p>
              <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight">
                {title}
              </h1>
            </header>

            {showGallery && (
              <div className="mt-8">
                <ProjectGallery
                  images={galleryImages}
                  altPrefix={title}
                  variant="inverted"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-semibold border-b-2 border-foreground pb-2">
                  {t("about_title")}
                </h2>
                <div className="mt-4">
                  <LongTextRenderer content={longDescription} />
                </div>
              </div>

              <aside className="space-y-8 md:sticky md:top-24 md:self-start">
                <Card className="p-6 bg-foreground text-background">
                  <CardHeader className="p-0">
                    <CardTitle className="text-lg text-background">
                      {t("details_title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-6 space-y-6">
                    {formattedDate && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          {t("developed_in_label")}
                        </h3>
                        <p className="text-sm text-background/70">
                          {formattedDate}
                        </p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm mb-2">
                        {t("tech_title")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(tags || []).map((tag) => {
                          const cleanTag = tag.trim().toLowerCase();
                          const techDetails = techDetailsMap[cleanTag];
                          const iconClassName = techDetails?.iconClassName;

                          if (techDetails?.url) {
                            return (
                              <a
                                key={tag}
                                href={techDetails.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  tagBaseClasses,
                                  "border-background text-background hover:bg-background hover:text-foreground"
                                )}
                              >
                                {iconClassName && (
                                  <i
                                    className={`${iconClassName} text-base mr-1.5`}
                                  ></i>
                                )}
                                <span>{tag}</span>
                              </a>
                            );
                          }

                          return (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="gap-1.5 px-2 py-1 border-background/30 text-background hover:bg-background/10"
                            >
                              {iconClassName && (
                                <i className={`${iconClassName} text-base`}></i>
                              )}
                              <span>{tag}</span>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    {hasLinks && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">
                          {t("links_title")}
                        </h3>
                        <div className="flex flex-col gap-2">
                          {liveUrl && (
                            <Button asChild variant="inverted">
                              <a
                                href={liveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {t("live_demo_button")}
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {repoUrl && (
                            <Button asChild variant="inverted">
                              <a
                                href={repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Github className="mr-2 h-4 w-4" />
                                {t("source_code_button")}
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </aside>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </AlternateLinksProvider>
  );
}
