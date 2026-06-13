// File: frontend/src/components/ScrollIndicator.tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { handleHashNav } from "@/lib/scroll";

interface ScrollIndicatorProps {
  href: string;
}

export function ScrollIndicator({ href }: ScrollIndicatorProps) {
  const ref = useRef<HTMLAnchorElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // --- THIS IS THE FIX ---
  // We've adjusted the mapping to be much more aggressive.
  const opacity = useTransform(
    scrollYProgress,
    // Input range (scroll progress):
    [
      0, // When it first enters the screen
      0.25, // Stays fully visible until it's 25% up the screen
      0.5, // Completely faded out by the time it reaches the middle
      1, // Stays faded out
    ],
    // Output range (opacity):
    [1, 1, 0, 0]
  );
  // -----------------------

  return (
    <motion.a
      ref={ref}
      href={href}
      onClick={(e) => handleHashNav(e, href)}
      aria-label="Scroll to next section"
      className="flex justify-center"
      style={{ opacity }}
    >
      <motion.div
        className="rounded-full border border-muted-foreground/50 p-1.5"
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
  );
}
