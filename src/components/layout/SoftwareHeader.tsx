"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { Link } from "@/i18n/navigation";
import { MobileNav } from "./MobileHeader";
import { Terminal } from "lucide-react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

interface SoftwareHeaderProps {
  showNavLinks?: boolean;
}

export function SoftwareHeader({ showNavLinks = false }: SoftwareHeaderProps) {
  const t = useTranslations("software.SoftwareHeader");

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navLinks = [
    { href: "#projekte", label: t("projects") },
    { href: "#skills", label: t("skills") },
    { href: "#resume-cta", label: t("resume") },
    { href: "#kontakt", label: t("contact") },
  ];

  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="sticky top-0 z-50 w-full bg-background"
    >
      <nav className="container mx-auto flex h-14 items-center justify-between relative">
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-lg transition-opacity hover:opacity-80"
        >
          <Terminal className="h-6 w-6" />
        </Link>
        {showNavLinks && (
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="hidden md:flex md:items-center md:gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <MobileNav navLinks={showNavLinks ? navLinks : undefined}>
            <LanguageToggle />
            <ThemeToggle />
          </MobileNav>
        </div>
      </nav>
    </motion.header>
  );
}
