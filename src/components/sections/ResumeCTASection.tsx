"use client";

import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { useResumeDownload } from "@/hooks/useResumeDownload";

export function ResumeCTASection() {
  const t = useTranslations("software.ResumeCTASection");
  const locale = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const { downloadResume } = useResumeDownload();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end center"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest > 0 && latest < 1) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  });

  return (
    <section
      id="resume-cta"
      className="w-full py-24 md:py-48 flex items-center justify-center"
    >
      <div
        ref={sectionRef}
        data-active={isActive}
        className={cn(
          "w-full max-w-5xl mx-auto rounded-3xl transition-colors duration-500 ease-in-out group py-16 px-4 md:px-12",
          "bg-muted/30",
          "data-[active=true]:bg-foreground"
        )}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4 max-w-3xl"
          >
            <div
              className={cn(
                "p-3 w-fit mx-auto rounded-full mb-4 transition-colors duration-500",
                "bg-primary/10",
                "group-data-[active=true]:bg-background/10"
              )}
            >
              <FileText
                className={cn(
                  "h-8 w-8 transition-colors duration-500",
                  "text-primary",
                  "group-data-[active=true]:text-background"
                )}
              />
            </div>
            <h2
              className={cn(
                "text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl transition-colors duration-500",
                "group-data-[active=true]:text-background"
              )}
            >
              {t("title")}
            </h2>
            <p
              className={cn(
                "mx-auto max-w-[700px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed transition-colors duration-500",
                "text-muted-foreground",
                "group-data-[active=true]:text-background/80"
              )}
            >
              {t("description")}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 min-[400px]:gap-6"
          >
            <Button
              asChild
              size="lg"
              className={cn(
                "gap-2 transition-all duration-500 border-2 border-transparent",
                // Active State (Dark Card): Transparent with White Border -> Hover: White Button
                "group-data-[active=true]:bg-transparent group-data-[active=true]:text-background group-data-[active=true]:border-background",
                "group-data-[active=true]:hover:bg-background group-data-[active=true]:hover:text-foreground"
              )}
            >
              <Link href="/resume" locale={locale}>
                <FileText className="h-4 w-4" />
                {t("viewResume")}
              </Link>
            </Button>
            <Button
              size="lg"
              onClick={downloadResume}
              className={cn(
                "gap-2 transition-all duration-500 border-2 border-transparent cursor-pointer",
                // Active State (Dark Card): Transparent with White Border -> Hover: White Button
                "group-data-[active=true]:bg-transparent group-data-[active=true]:text-background group-data-[active=true]:border-background",
                "group-data-[active=true]:hover:bg-background group-data-[active=true]:hover:text-foreground"
              )}
            >
              <Download className="h-4 w-4" />
              {t("downloadPdf")}
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
