"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HeroTerminalProps {
  name: string;
  roles: string[];
  interval?: number;
  className?: string;
}

const TYPING_SPEED = 38; // Snappy keystroke speed (~38ms/char)
const EXIT_DURATION = 220; // Upward scroll duration

function formatLastLogin(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate().toString().padStart(2, " ");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `Last login: ${dayName} ${monthName} ${dayNum} ${hours}:${minutes}:${seconds} on ttys001`;
}

export function HeroTerminal({
  name,
  roles,
  interval = 3200,
  className,
}: HeroTerminalProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const [lastLogin, setLastLogin] = useState<string>("");

  // Animation phases:
  // "cursor-init" -> initial cursor blinks once under Last login
  // "prompt-drop"  -> ~ [name] and > lines appear with downward drop animation
  // "typing-role"  -> cursor types the job title on the > line
  // "holding"      -> cursor blinks at end of completed job title
  // "moving-up"    -> job title scrolls upward away
  const [phase, setPhase] = useState<
    "cursor-init" | "prompt-drop" | "typing-role" | "holding" | "moving-up"
  >("cursor-init");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedRoleChars, setTypedRoleChars] = useState(0);

  const currentRole = roles[currentIndex] || roles[0] || "";

  // Set visitor login timestamp upon mount (avoids SSR mismatch)
  useEffect(() => {
    setLastLogin(formatLastLogin(new Date()));
  }, []);

  // 1. Initial cursor blinks once, then drops prompt
  useEffect(() => {
    if (shouldReduceMotion) {
      setPhase("holding");
      setTypedRoleChars(currentRole.length);
      return;
    }

    const timer = setTimeout(() => {
      setPhase("prompt-drop");
    }, 700);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Prompt dropped: transition quickly to typing role
  useEffect(() => {
    if (phase !== "prompt-drop") return;

    const timer = setTimeout(() => {
      setPhase("typing-role");
    }, 180);

    return () => clearTimeout(timer);
  }, [phase]);

  // 3. Typing Job Title on the ">" line
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

  // 4. Holding Job Title with blinking cursor
  useEffect(() => {
    if (phase !== "holding") return;
    if (isPaused || roles.length <= 1) return;

    const holdTimer = setTimeout(() => {
      setPhase("moving-up");
    }, interval);

    return () => clearTimeout(holdTimer);
  }, [phase, isPaused, roles.length, interval]);

  // 5. Upward exit ("move up away") -> next role starts
  useEffect(() => {
    if (phase !== "moving-up") return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % roles.length);
      setTypedRoleChars(0);
      setPhase("typing-role");
    }, EXIT_DURATION);

    return () => clearTimeout(timer);
  }, [phase, roles.length]);

  // Cursor component helper
  const renderCursor = (size: "lg" | "md", isBlinking = false) => {
    if (isBlinking) {
      return (
        <motion.span
          className={cn(
            "inline-block bg-foreground align-middle ml-1 select-none",
            size === "lg" ? "h-[1.1em] w-[0.55em]" : "h-[1.15em] w-[0.55em]"
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
          size === "lg" ? "h-[1.1em] w-[0.55em]" : "h-[1.15em] w-[0.55em]"
        )}
        aria-hidden="true"
      />
    );
  };

  const showPrompt = phase !== "cursor-init";

  return (
    <div
      className={cn("w-full select-none text-left font-mono min-h-[140px] sm:min-h-[170px] lg:min-h-[190px]", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Banner: Last login timestamp line */}
      <div className="text-xs sm:text-sm font-mono text-muted-foreground/75 mb-2 sm:mb-3 min-h-[1.25rem] select-none tracking-tight whitespace-pre">
        {lastLogin || "\u00A0"}
      </div>

      {/* Initializing Standalone Cursor */}
      {!showPrompt && (
        <div className="text-3xl sm:text-5xl lg:text-6xl min-h-[2.5rem] sm:min-h-[3.5rem] flex items-center">
          <motion.span
            className="inline-block h-[1.1em] w-[0.55em] bg-foreground align-middle select-none"
            animate={{ opacity: [1, 1, 0, 0, 1] }}
            transition={{
              duration: 0.45,
              repeat: 1,
              times: [0, 0.4, 0.4, 0.8, 1],
            }}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Prompt Lines: ~ [My name] and > [JOB TITLE] with snappy downward drop */}
      {showPrompt && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="flex flex-col"
        >
          {/* Line 1: ~ [My name] */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight flex items-baseline">
            <span className="text-cyan-500 dark:text-cyan-400 select-none mr-2 sm:mr-3">
              ~
            </span>
            <span className="text-foreground">{name}</span>
          </h1>

          {/* Line 2: > [JOB TITLE] */}
          <div className="mt-3 sm:mt-5 text-xl sm:text-3xl lg:text-4xl font-normal min-h-[2rem] sm:min-h-[2.75rem] flex items-baseline">
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
          </div>
        </motion.div>
      )}
    </div>
  );
}
