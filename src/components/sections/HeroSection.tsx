// src/components/sections/software/HeroSection.tsx
"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimatedGreeting } from "@/components/AnimatedGreeting";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const t = useTranslations("software.SoftwareHeroSection");
  const avatarSrc = "/images/avatar.png";
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
      className="relative flex min-h-screen items-center justify-center"
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col-reverse items-center gap-12 text-center lg:grid lg:grid-cols-2 lg:text-left">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center lg:items-start"
        >
          <AnimatedGreeting />
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t("intro")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 lg:justify-start">
            <Button asChild>
              <a href="#projekte">{t("button_projects")}</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-center lg:justify-end"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
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
              "h-56 w-56 border-4 lg:size-[418px] group",
              "transition-all duration-500 ease-in-out",
              "bg-transparent border-muted-foreground",
              "data-[active=true]:bg-foreground",
              "data-[active=true]:border-foreground"
            )}
          >
            <AvatarImage
              src={avatarSrc}
              alt="Profile picture of me"
              className={cn(
                "object-cover object-top scale-[1.2] origin-bottom transition-transform duration-500 ease-in-out",
                "group-data-[active=true]:scale-[1.3]",
                // --- THIS IS THE DEFINITIVE FIX ---
                // Add a downward translation only when the parent group is active
                "group-data-[active=true]:translate-y-4"
              )}
            />
            <AvatarFallback>My Picture</AvatarFallback>
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
