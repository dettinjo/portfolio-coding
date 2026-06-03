"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function AnimatedGreeting() {
  const t = useTranslations("software.SoftwareHeroSection");

  const fullName = process.env.NEXT_PUBLIC_FULL_NAME || "";
  const firstName = fullName.split(" ")[0];
  const greetingText = t("greeting", { name: firstName });

  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) =>
    greetingText.slice(0, latest)
  );

  useEffect(() => {
    const controls = animate(count, greetingText.length, {
      type: "tween",
      duration: 2.5,
      ease: "linear",
      delay: 0.5,
    });
    return controls.stop;
  }, [greetingText.length, count]);

  return (
    <h1 className="text-4xl font-bold tracking-tight lg:text-6xl font-mono">
      <motion.span>{displayText}</motion.span>

      {/* --- THE FIX IS HERE --- */}
      <motion.div
        className="ml-1 inline-block h-10 w-4 bg-foreground align-bottom"
        // We use a keyframes array for opacity and times to control the blink
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          times: [0, 0.5, 0.5, 1, 1], // Stays visible for 50%, invisible for 50%
        }}
      />
    </h1>
  );
}
