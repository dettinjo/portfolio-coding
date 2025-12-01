// src/components/sections/software/AnimatedProjectCard.tsx
"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import type { SoftwareProject } from "@/lib/payload-types-shared";
import { getMediaUrl } from "@/lib/payload-helpers";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

interface AnimatedProjectCardProps {
  project: SoftwareProject;
  index: number;
  isActive: boolean;
  onScrollProgressChange: (progress: number) => void;
}

// const AnimatedLink = motion(Link);

export function AnimatedProjectCard({
  project,
  index,
  isActive,
  onScrollProgressChange,
}: AnimatedProjectCardProps) {
  const t = useTranslations("software.SoftwareProjectsSection");
  const cardRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    onScrollProgressChange(latest);
  });

  const { title, description, coverImage, projectType, slug } = project;
  const imageUrl = getMediaUrl(coverImage) || "/placeholder.jpg";

  const locale = useLocale();

  return (
    // UPDATED: The motion link handles its own animation, no staggered fade-in
    // UPDATED: Wrap Link in motion.div instead of using motion(Link)
    <motion.div
      ref={cardRef} // framer-motion ref
      data-active={isActive}
      className={cn(
        "group flex flex-col md:flex-row min-h-[410px] rounded-xl overflow-hidden shadow-lg",
        "transition-colors duration-300 ease-in-out", // Use transition for colors
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        "data-[active=true]:bg-foreground"
      )}
      animate={{ scale: isActive ? 1.02 : 1 }}
      transition={{ duration: 0.3, ease: "easeInOut" }} // Transition for the scale
      whileHover={{ scale: 1.02 }}
      whileFocus={{ scale: 1.02 }}
    >
      <Link
        href={`/${slug}`}
        locale={locale}
        className="flex flex-col md:flex-row w-full h-full"
      >
        {/* The rest of the component remains the same */}
        <div
          className={cn(
            "h-64 md:h-auto md:w-1/2 p-8 md:p-16",
            index % 2 === 1 ? "md:order-last" : ""
          )}
        >
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt={`Preview for ${title}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
            />
          </div>
        </div>
        <div className="flex flex-col md:w-1/2 p-10 md:p-16">
          <div className="flex-grow">
            <p className="text-sm font-semibold text-muted-foreground tracking-wider uppercase transition-colors duration-500 group-data-[active=true]:text-background/70">
              {projectType}
            </p>
            <h3 className="text-3xl font-bold mt-2 text-foreground transition-colors duration-500 group-data-[active=true]:text-background">
              {title}
            </h3>
            <p className="mt-4 text-muted-foreground line-clamp-3 transition-colors duration-500 group-data-[active=true]:text-background/80">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground transition-colors duration-500 group-data-[active=true]:text-background">
            <span>{t("button_details")}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-data-[active=true]:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
