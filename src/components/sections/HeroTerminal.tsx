"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroTerminalProps {
  name: string;
  roles: string[];
  interval?: number;
  className?: string;
}

const TYPING_SPEED = 38; // Snappy, unified terminal keystroke speed (~38ms/char)
const PAUSE_AFTER_NAME = 320; // Natural pause after name before moving to line 2
const EXIT_DURATION = 220; // Snappy upward scroll duration

export function HeroTerminal({
  name,
  roles,
  interval = 3200,
  className,
}: HeroTerminalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  // Phases:
  // "idle" -> initial tick before cursor begins
  // "typing-name" -> cursor types "~ [name]"
  // "pause-name" -> short pause at end of name before newline
  // "typing-role" -> cursor types "> [role]"
  // "holding" -> cursor blinks at end of completed role
  // "moving-up" -> role scrolls up away
  const [phase, setPhase] = useState<
    "idle" | "typing-name" | "pause-name" | "typing-role" | "holding" | "moving-up"
  >("idle");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedLine1, setTypedLine1] = useState(0);
  const [typedRoleChars, setTypedRoleChars] = useState(0);

  const fullLine1 = useMemo(() => `~ ${name}`, [name]);
  const currentRole = roles[currentIndex] || roles[0] || "";

  // 1. Initial boot / startup (runs once on mount)
  useEffect(() => {
    if (shouldReduceMotion) {
      setPhase("holding");
      setTypedLine1(fullLine1.length);
      setTypedRoleChars(roles[0]?.length || 0);
      return;
    }

    const timer = setTimeout(() => {
      setPhase("typing-name");
    }, 150);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Typing Line 1: "~ [name]"
  useEffect(() => {
    if (phase !== "typing-name") return;

    if (typedLine1 < fullLine1.length) {
      const timer = setTimeout(() => {
        setTypedLine1((prev) => prev + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else {
      setPhase("pause-name");
    }
  }, [phase, typedLine1, fullLine1.length]);

  // 3. Pause at the end of the name
  useEffect(() => {
    if (phase !== "pause-name") return;

    const timer = setTimeout(() => {
      setPhase("typing-role");
    }, PAUSE_AFTER_NAME);

    return () => clearTimeout(timer);
  }, [phase]);

  // 4. Typing Line 2: Role
  useEffect(() => {
    if (phase !== "typing-role") return;

    if (typedRoleChars < currentRole.length) {
      const timer = setTimeout(() => {
        setTypedRoleChars((prev) => prev + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else {
      setPhase("holding");
    }
  }, [phase, typedRoleChars, currentRole.length]);

  // 5. Holding Line 2 (blinking cursor)
  useEffect(() => {
    if (phase !== "holding") return;
    if (isPaused || roles.length <= 1) return;

    const holdTimer = setTimeout(() => {
      setPhase("moving-up");
    }, interval);

    return () => clearTimeout(holdTimer);
  }, [phase, isPaused, roles.length, interval]);

  // 6. Upward exit ("move up away") -> next role starts
  useEffect(() => {
    if (phase !== "moving-up") return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % roles.length);
      setTypedRoleChars(0);
      setPhase("typing-role");
    }, EXIT_DURATION);

    return () => clearTimeout(timer);
  }, [phase, roles.length]);

  // Cursor helper
  const renderCursor = (size: "lg" | "md", isBlinking = false) => {
    if (isBlinking) {
      return (
        <motion.span
          className={cn(
            "inline-block bg-foreground align-middle ml-1 select-none",
            size === "lg"
              ? "h-[1.1em] w-[0.55em]"
              : "h-[1.15em] w-[0.55em]"
          )}
          animate={{ opacity: [1, 1, 0, 0, 1] }}
          transition={{
            duration: 1.0,
            repeat: Infinity,
            times: [0, 0.5, 0.5, 1, 1],
          }}
          aria-hidden="true"
        />
      );
    }

    return (
      <span
        className={cn(
          "inline-block bg-foreground align-middle ml-1 select-none",
          size === "lg"
            ? "h-[1.1em] w-[0.55em]"
            : "h-[1.15em] w-[0.55em]"
        )}
        aria-hidden="true"
      />
    );
  };

  const showPrompt1 = typedLine1 >= 1;
  const rawTypedName = typedLine1 > 2 ? fullLine1.slice(2, typedLine1) : "";
  const isTypingName = phase === "typing-name" || phase === "idle";
  const isPausedAtName = phase === "pause-name";
  const showNameCursor = isTypingName || isPausedAtName;

  const showLine2 =
    phase === "typing-role" || phase === "holding" || phase === "moving-up";

  return (
    <div
      className={cn("w-full select-none text-left font-mono", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Line 1: ~ [My name] */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight flex items-baseline">
        {showPrompt1 && (
          <span className="text-cyan-500 dark:text-cyan-400 select-none mr-2 sm:mr-3">
            ~
          </span>
        )}
        <span className="text-foreground">{rawTypedName}</span>
        {showNameCursor && renderCursor("lg", isPausedAtName)}
      </h1>

      {/* Line 2: > [JOB TITLE] */}
      <div className="mt-3 sm:mt-5 text-xl sm:text-3xl lg:text-4xl font-semibold min-h-[2rem] sm:min-h-[2.75rem] flex items-baseline">
        {showLine2 && (
          <>
            <span className="text-emerald-500 dark:text-emerald-400 font-bold mr-2 sm:mr-3 select-none">
              &gt;
            </span>

            <div className="relative inline-flex items-baseline overflow-hidden py-1">
              {phase === "moving-up" ? (
                <motion.span
                  key={`exit-${currentIndex}`}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="text-foreground/90 inline-block"
                >
                  {currentRole}
                </motion.span>
              ) : (
                <span className="text-foreground/90 inline-flex items-baseline">
                  {currentRole.slice(0, typedRoleChars)}
                  {renderCursor("md", phase === "holding")}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
