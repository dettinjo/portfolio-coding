// src/components/sections/software/HeroSection.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { AnimatedGreeting } from "@/components/AnimatedGreeting";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { withBasePath } from "@/lib/basePath";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const t = useTranslations("software.SoftwareHeroSection");
  const locale = useLocale();
  // Generated at build time from the config repo's profile image (or the
  // committed placeholder when none is provided). See scripts/fetch-portfolio.ts.
  const avatarSrc = withBasePath("/images/profile.webp");
  const heroRef = useRef<HTMLElement>(null);
  const [isAvatarActive, setIsAvatarActive] = useState(true);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsAvatarActive(latest < 0.5);
  });

  const { scrollY } = useScroll();
  const arrowOpacity = useTransform(scrollY, [0, 150, 300], [1, 1, 0]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex min-h-screen items-center justify-center py-20 lg:py-0"
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col-reverse items-center gap-8 lg:gap-12 text-center lg:grid lg:grid-cols-2 lg:text-left w-full">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center lg:items-start w-full"
        >
          <AnimatedGreeting />
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground">
            {t("intro")}
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto lg:mx-0">
            <Button asChild className="w-full sm:w-auto">
              <Link href="#projekte">{t("button_projects")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto hover:bg-foreground hover:text-background transition-colors"
            >
              <Link href="/resume" locale={locale}>
                {t("button_resume")}
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center lg:justify-end"
          initial={false}
          animate={{
            scale: isAvatarActive ? 1.05 : 1,
          }}
          transition={{
            duration: 0.5,
            ease: "easeInOut",
          }}
        >
          <Avatar
            data-active={isAvatarActive}
            className={cn(
              "h-48 w-48 sm:h-56 sm:w-56 border-4 lg:size-[418px] group",
              "transition-all duration-500 ease-in-out",
              "bg-transparent border-foreground",
              "data-[active=true]:bg-foreground"
            )}
          >
            <Image
              src={avatarSrc}
              alt="Profile picture of me"
              fill
              sizes="(max-width: 640px) 192px, (max-width: 1024px) 224px, 418px"
              priority
              className={cn(
                // Anchor the bottom of the photo to the bottom of the circle so
                // the head keeps headroom at the top instead of being cropped.
                "object-cover object-bottom origin-bottom transition-all duration-500 ease-in-out",
                "group-data-[active=true]:scale-105",
                "group-data-[active=true]:brightness-0 group-data-[active=true]:invert",
                "dark:group-data-[active=true]:brightness-0 dark:group-data-[active=true]:invert-0"
              )}
            />
          </Avatar>
        </motion.div>
      </div>

      <motion.a
        href="#projekte"
        aria-label="Scroll to projects section"
        className="fixed bottom-10 left-1/2 -translate-x-1/2"
        style={{ opacity: arrowOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 2.5 }}
      >
        <motion.div
          className="rounded-full border border-muted-foreground/50 p-1.5 transition-colors hover:border-muted-foreground"
          animate={{ y: [0, 6, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        >
          <ArrowDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </motion.a>
    </section>
  );
}
