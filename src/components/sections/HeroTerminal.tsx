"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface HeroTerminalItem {
  role: string;
  description?: string;
  fullText?: string;
}

interface HeroTerminalProps {
  name: string;
  items?: HeroTerminalItem[];
  roles?: string[];
  mode?: "role" | "full" | "inline";
  interval?: number;
  className?: string;
}

const TYPING_SPEED = 38; // Snappy keystroke speed (~38ms/char)
const EXIT_DURATION = 220; // Upward scroll duration

function getVisitorEnvironment(): string {
  if (typeof window === "undefined" || !navigator) return "console";

  const ua = navigator.userAgent || "";
  const navAny = navigator as unknown as { userAgentData?: { platform?: string } };
  const platform = navAny.userAgentData?.platform || "";

  // 1. Mobile devices
  if (/iPhone/i.test(ua)) return "iphone";
  if (/iPad/i.test(ua) || (platform === "macOS" && navigator.maxTouchPoints > 1)) return "ipad";
  if (/Android/i.test(ua)) return "android";

  // 2. Desktop Operating Systems
  if (/Macintosh|Mac OS X/i.test(ua) || platform === "macOS") return "macos";
  if (/Windows/i.test(ua) || platform === "Windows") return "windows";
  if (/Linux/i.test(ua) || platform === "Linux") return "linux";

  return "console";
}

function formatLastLogin(date: Date, device: string): string {
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

  return `Last login: ${dayName} ${monthName} ${dayNum} ${hours}:${minutes}:${seconds} on ${device}`;
}

export function HeroTerminal({
  name,
  items,
  roles,
  mode = "role",
  interval = 3200,
  className,
}: HeroTerminalProps) {
  const normalizedItems: HeroTerminalItem[] =
    items && items.length > 0
      ? items
      : (roles || ["Software Engineer"]).map((r) => ({ role: r, fullText: r }));

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

  const currentItem = normalizedItems[currentIndex] || normalizedItems[0] || { role: "" };
  const currentRole = mode === "inline" ? (currentItem.fullText || currentItem.role) : currentItem.role;
  const currentDescription = mode === "full" ? currentItem.description : undefined;

  // Set visitor login timestamp upon mount with detected device (avoids SSR mismatch)
  useEffect(() => {
    const device = getVisitorEnvironment();
    setLastLogin(formatLastLogin(new Date(), device));
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
    if (isPaused || normalizedItems.length <= 1) return;

    const holdTimer = setTimeout(() => {
      setPhase("moving-up");
    }, interval);

    return () => clearTimeout(holdTimer);
  }, [phase, isPaused, normalizedItems.length, interval]);

  // 5. Upward exit ("move up away") -> next role starts
  useEffect(() => {
    if (phase !== "moving-up") return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % normalizedItems.length);
      setTypedRoleChars(0);
      setPhase("typing-role");
    }, EXIT_DURATION);

    return () => clearTimeout(timer);
  }, [phase, normalizedItems.length]);

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
      className={cn(
        "w-full select-text text-left font-mono",
        mode === "full"
          ? "min-h-[170px] sm:min-h-[210px] lg:min-h-[230px]"
          : "min-h-[140px] sm:min-h-[170px] lg:min-h-[190px]",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Top Banner: Last login timestamp line */}
      <div className="text-xs sm:text-sm font-mono text-muted-foreground/75 mb-2 sm:mb-3 min-h-[1.25rem] tracking-tight whitespace-pre select-text">
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
          className="flex flex-col select-text"
        >
          {/* Line 1: ~ [My name] */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight flex items-baseline">
            <span className="text-slate-400 dark:text-slate-400 font-normal mr-2 sm:mr-3 select-text">
              ~
            </span>
            <span className="text-foreground select-text">{name}</span>
          </h1>

          {/* Line 2: ❯ [JOB TITLE] */}
          <div className="mt-3 sm:mt-5 text-xl sm:text-3xl lg:text-4xl font-light min-h-[2rem] sm:min-h-[2.75rem] flex items-baseline select-text">
            <span className="text-emerald-400 dark:text-emerald-400 font-bold mr-2 sm:mr-3 select-text">
              ❯
            </span>

            <div className="relative inline-flex items-baseline overflow-hidden py-1">
              {phase === "moving-up" ? (
                <motion.span
                  key={`exit-${currentIndex}`}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: -30, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="text-foreground/85 font-light inline-block"
                >
                  {currentRole}
                </motion.span>
              ) : (
                <span className="text-foreground/85 font-light inline-flex items-baseline">
                  {currentRole.slice(0, typedRoleChars)}
                  {renderCursor("md", phase === "holding")}
                </span>
              )}
            </div>
          </div>

          {/* Line 3: Optional description subline when mode === "full" and currentDescription is present */}
          {mode === "full" && currentDescription && (
            <div className="mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-mono text-muted-foreground/80 flex items-start select-text min-h-[1.75rem]">
              <span className="text-emerald-400/70 dark:text-emerald-400/70 font-bold mr-2 sm:mr-3 select-none">
                ↳
              </span>
              <div className="relative inline-flex items-baseline overflow-hidden">
                {phase === "moving-up" ? (
                  <motion.span
                    key={`desc-exit-${currentIndex}`}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -24, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                    className="inline-block text-muted-foreground"
                  >
                    {currentDescription}
                  </motion.span>
                ) : phase === "holding" ? (
                  <motion.span
                    key={`desc-${currentIndex}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="inline-block text-muted-foreground"
                  >
                    {currentDescription}
                  </motion.span>
                ) : (
                  <span className="opacity-0 select-none" aria-hidden="true">
                    {currentDescription}
                  </span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
