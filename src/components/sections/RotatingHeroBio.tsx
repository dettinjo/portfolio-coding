"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BioRotationItem } from "@/lib/types";

interface RotatingHeroBioProps {
  items: BioRotationItem[];
  interval?: number;
  fallbackText?: string;
  locale?: string;
  isActive?: boolean;
  hasPointer?: boolean;
  className?: string;
}

const TERMINAL_GLYPHS = ["_", "/", "\\", "|", "~", ">", "#", "0", "1", "█"];

export function RotatingHeroBio({
  items,
  interval = 4000,
  fallbackText,
  locale = "en",
  isActive = false,
  hasPointer = false,
  className,
}: RotatingHeroBioProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Lifecycle phases: "waiting" | "initial-typing" | "holding" | "scrambling"
  const [phase, setPhase] = useState<"waiting" | "initial-typing" | "holding" | "scrambling">("waiting");
  const [initialTypedChars, setInitialTypedChars] = useState(0);
  const [scrambleProgress, setScrambleProgress] = useState(0); // 0 to 1

  const total = items.length;
  const currentItem = items[currentIndex] || items[0];

  // Grammatical connector strings by locale
  const getArticle = useCallback(
    (word: string) => {
      if (locale === "de") return "Ein";
      if (locale === "es") return "Un";
      const startsWithVowel = /^[aeiou]/i.test(word.trim());
      return startsWithVowel ? "An" : "A";
    },
    [locale]
  );

  const bridgeText = useMemo(() => {
    if (locale === "de") return "mit einer Leidenschaft für die Gestaltung und Realisierung von";
    if (locale === "es") return "con pasión por diseñar y construir";
    return "with a passion for designing and building";
  }, [locale]);

  // Construct full cohesive sentence for the initial typing phase
  const fullSentence = useMemo(() => {
    if (!currentItem) return "";
    if (currentItem.sentence) return currentItem.sentence;
    const article = getArticle(currentItem.role);
    const traits = currentItem.adjectives.join(", ");
    if (locale === "de") {
      return `${article} ${currentItem.role} ${bridgeText} ${traits} ${currentItem.artifacts}.`;
    }
    if (locale === "es") {
      return `${article} ${currentItem.role} ${bridgeText} ${currentItem.artifacts} ${traits}.`;
    }
    return `${article} ${currentItem.role} ${bridgeText} ${traits} ${currentItem.artifacts}.`;
  }, [currentItem, getArticle, bridgeText, locale]);

  // ─── 1. ACTIVATE WHEN GREETING FINISHES ──────────────────────────────────
  useEffect(() => {
    if (isActive && phase === "waiting") {
      if (shouldReduceMotion) {
        setInitialTypedChars(fullSentence.length);
        setPhase("holding");
      } else {
        setPhase("initial-typing");
      }
    }
  }, [isActive, phase, fullSentence.length, shouldReduceMotion]);

  // ─── 2. INITIAL TYPING (Types out once from left to right) ───────────────
  useEffect(() => {
    if (phase !== "initial-typing") return;

    if (initialTypedChars < fullSentence.length) {
      const timer = setTimeout(() => {
        setInitialTypedChars((prev) => prev + 1);
      }, 22);
      return () => clearTimeout(timer);
    } else {
      // Finished initial typing -> move to holding phase
      setPhase("holding");
    }
  }, [phase, initialTypedChars, fullSentence.length]);

  // ─── 3. HOLD & TRIGGER FAST TERMINAL SWITCH ─────────────────────────────
  useEffect(() => {
    if (phase !== "holding") return;
    if (isPaused || total <= 1) return;

    const holdTimer = setTimeout(() => {
      // Trigger small and fast terminal switch (does NOT delete everything!)
      setPhase("scrambling");
      setScrambleProgress(0);
    }, interval);

    return () => clearTimeout(holdTimer);
  }, [phase, isPaused, total, interval]);

  // ─── 4. SMALL AND FAST TERMINAL ANIMATION (Fast scramble & lock-in) ──────
  useEffect(() => {
    if (phase !== "scrambling") return;

    const totalSteps = 6;
    let step = 0;

    const intervalId = setInterval(() => {
      step++;
      setScrambleProgress(step / totalSteps);

      if (step >= totalSteps) {
        clearInterval(intervalId);
        // Switch index and lock into new description
        setCurrentIndex((prev) => (prev + 1) % (total || 1));
        setPhase("holding");
        setScrambleProgress(0);
      }
    }, 28); // 6 steps * 28ms = ~168ms total! Fast terminal update

    return () => clearInterval(intervalId);
  }, [phase, total]);

  // Helper to generate terminal scramble for changing text
  const getScrambled = (targetText: string) => {
    if (scrambleProgress === 0 || scrambleProgress >= 1) return targetText;
    const len = targetText.length;
    // Reveal targetText characters progressively while scrambling the rest
    const revealedCount = Math.floor(len * scrambleProgress);
    let result = "";
    for (let i = 0; i < len; i++) {
      if (i < revealedCount) {
        result += targetText[i];
      } else if (targetText[i] === " " || targetText[i] === "," || targetText[i] === ".") {
        result += targetText[i];
      } else {
        const glyph = TERMINAL_GLYPHS[Math.floor(Math.random() * TERMINAL_GLYPHS.length)];
        result += glyph;
      }
    }
    return result;
  };

  if (!items || items.length === 0) {
    return (
      <p className={cn("text-base sm:text-lg leading-7 sm:leading-8 text-muted-foreground", className)}>
        {fallbackText}
      </p>
    );
  }

  // Display calculations
  const roleText = `${getArticle(currentItem.role)} ${currentItem.role}`;
  const focusText =
    locale === "es"
      ? `${currentItem.artifacts} ${currentItem.adjectives.join(", ")}.`
      : `${currentItem.adjectives.join(", ")} ${currentItem.artifacts}.`;

  const roleLen = roleText.length;
  const bridgePart = ` ${bridgeText} `;
  const bridgeLen = bridgePart.length;

  const renderedRole = phase === "scrambling" ? getScrambled(roleText) : roleText;
  const renderedFocus = phase === "scrambling" ? getScrambled(focusText) : focusText;

  // The inline pointer element: solid while typing, blinking while holding
  const renderPointer = (isTyping = false) => {
    if (!hasPointer) return null;
    if (isTyping) {
      return (
        <span
          className="ml-1 inline-block h-[1.15em] w-[0.55em] bg-foreground align-middle"
          aria-hidden="true"
        />
      );
    }
    return (
      <motion.span
        className="ml-1 inline-block h-[1.15em] w-[0.55em] bg-foreground align-middle"
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          times: [0, 0.5, 0.5, 1, 1],
        }}
      />
    );
  };

  // Helper to colorize text based on boundaries (role, bridge, focus)
  const colorizeStream = (text: string, startOffset: number) => {
    const endOffset = startOffset + text.length;
    const spans: React.ReactNode[] = [];

    // Role segment
    if (startOffset < roleLen) {
      const segEnd = Math.min(endOffset, roleLen);
      spans.push(
        <span key="role" className="text-foreground font-bold">
          {text.slice(0, segEnd - startOffset)}
        </span>
      );
    }
    // Bridge segment
    if (endOffset > roleLen && startOffset < roleLen + bridgeLen) {
      const segStart = Math.max(startOffset, roleLen);
      const segEnd = Math.min(endOffset, roleLen + bridgeLen);
      spans.push(
        <span key="bridge" className="text-muted-foreground">
          {text.slice(segStart - startOffset, segEnd - startOffset)}
        </span>
      );
    }
    // Focus segment
    if (endOffset > roleLen + bridgeLen) {
      const segStart = Math.max(startOffset, roleLen + bridgeLen);
      spans.push(
        <span key="focus" className="text-foreground font-semibold">
          {text.slice(segStart - startOffset)}
        </span>
      );
    }
    return spans;
  };

  // Helper to render initial typing stream so pointer stays attached to the active word
  const renderInitialTypingStream = () => {
    const typed = fullSentence.slice(0, initialTypedChars);
    if (!typed) return renderPointer(true);

    const lastSpaceIdx = typed.lastIndexOf(" ");
    const hasSpace = lastSpaceIdx !== -1;
    const prefixTyped = hasSpace ? typed.slice(0, lastSpaceIdx + 1) : "";
    const activeWord = hasSpace ? typed.slice(lastSpaceIdx + 1) : typed;

    return (
      <span>
        {hasSpace && colorizeStream(prefixTyped, 0)}
        <span className="whitespace-nowrap">
          {colorizeStream(activeWord, prefixTyped.length)}
          {renderPointer(true)}
        </span>
      </span>
    );
  };

  // Focus tail split so holding pointer never drops below period
  const lastFocusSpaceIdx = renderedFocus.lastIndexOf(" ");
  const focusPrefix = lastFocusSpaceIdx !== -1 ? renderedFocus.slice(0, lastFocusSpaceIdx + 1) : "";
  const focusLastWord = lastFocusSpaceIdx !== -1 ? renderedFocus.slice(lastFocusSpaceIdx + 1) : renderedFocus;

  return (
    <div
      className={cn("w-full select-none", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="min-h-[84px] sm:min-h-[76px] text-base sm:text-lg lg:text-xl leading-7 sm:leading-8 font-mono text-left">
        {phase !== "waiting" && (
          <p className="leading-relaxed">
            {/* Terminal prompt symbol */}
            <span className="text-emerald-500 dark:text-emerald-400 font-bold mr-2 select-none">
              &gt;
            </span>

            {/* INITIAL TYPING: Pointer stays glued to current word */}
            {phase === "initial-typing" && renderInitialTypingStream()}

            {/* HOLDING & SCRAMBLE: Pointer sits at the end of the completed sentence */}
            {(phase === "holding" || phase === "scrambling") && (
              <span>
                {/* Dynamic Job Title */}
                <span className="text-foreground font-bold">
                  {renderedRole}
                </span>

                {/* Static Bridge - NEVER deleted or wiped */}
                <span className="text-muted-foreground">
                  {" "}{bridgeText}{" "}
                </span>

                {/* Dynamic Project & Focus with pointer attached to last word */}
                <span className="text-foreground font-semibold">
                  {focusPrefix}
                  <span className="whitespace-nowrap">
                    {focusLastWord}
                    {renderPointer(phase === "scrambling")}
                  </span>
                </span>
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
