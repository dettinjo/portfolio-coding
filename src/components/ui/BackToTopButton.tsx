// src/components/ui/BackToTopButton.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      // --- THIS IS THE FIX (PART 1) ---
      // Removed unused variables
      // const scrollPosition = window.pageYOffset + window.innerHeight;
      // const pageHeight = document.documentElement.scrollHeight;

      // Show button when user has scrolled 1/4 of the page
      if (window.pageYOffset > window.innerHeight / 4) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility();

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <button
            onClick={scrollToTop}
            aria-label="Back to Top"
            className="flex justify-center"
          >
            <motion.div
              className="rounded-full border border-muted-foreground/50 p-1.5 transition-colors hover:border-muted-foreground"
              animate={{ y: [0, 6, 0] }} // Bouncing animation
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            >
              <ArrowUp className="h-5 w-5 text-muted-foreground" />
            </motion.div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
