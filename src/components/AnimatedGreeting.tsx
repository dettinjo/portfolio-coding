"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { siteConfig } from "@/lib/config";

interface AnimatedGreetingProps {
  onComplete?: () => void;
  showPointer?: boolean;
}

export function AnimatedGreeting({ onComplete, showPointer = true }: AnimatedGreetingProps) {
  const t = useTranslations("software.SoftwareHeroSection");

  const firstName = siteConfig.person.firstName;
  const greetingText = t("greeting", { name: firstName });

  const [isTyping, setIsTyping] = useState(true);
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) =>
    greetingText.slice(0, latest)
  );

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const controls = animate(count, greetingText.length, {
      type: "tween",
      duration: 2.2,
      ease: "linear",
      delay: 0.4,
      onComplete: () => {
        setIsTyping(false);
        // Pointer stops at the name for a brief pause (500ms) before moving to description
        timeoutId = setTimeout(() => {
          onComplete?.();
        }, 500);
      },
    });
    return () => {
      controls.stop();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [greetingText.length, count, onComplete]);

  return (
    <h1 className="text-4xl font-bold tracking-tight lg:text-6xl font-mono">
      <motion.span>{displayText}</motion.span>

      {showPointer && (
        isTyping ? (
          <span
            className="ml-1 inline-block h-8 w-3 sm:h-10 sm:w-4 bg-foreground align-bottom"
            aria-hidden="true"
          />
        ) : (
          <motion.div
            className="ml-1 inline-block h-8 w-3 sm:h-10 sm:w-4 bg-foreground align-bottom"
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              times: [0, 0.5, 0.5, 1, 1],
            }}
          />
        )
      )}
    </h1>
  );
}
