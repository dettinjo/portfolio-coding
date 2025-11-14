// src/components/sections/software/SkillsSection.tsx
"use client";

import { useState, useRef } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useTranslations } from "next-intl";
import { SkillsGrid } from "./SkillsGrid";
import { ProficiencyLegend } from "@/components/ProficiencyLegend";
import { cn } from "@/lib/utils";

// --- Interfaces remain the same ---
interface Skill {
  name: string;
  iconClassName: string;
  level: number;
  url: string;
}
interface SkillCategory {
  category: string;
  skills: Skill[];
}
interface SkillsSectionProps {
  skills: SkillCategory[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const t = useTranslations("software.SoftwareSkillsSection");
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setIsActive(latest > 0.2 && latest < 0.8);
  });

  return (
    <section id="skills" ref={sectionRef}>
      {/* UPDATED: Adjusted margin-bottom from mb-12 to mb-8 */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold tracking-tight">{t("title")}</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
        {/* The legend has been moved from here */}
      </div>

      <motion.div
        data-active={isActive}
        className={cn(
          "group rounded-xl p-6 md:p-8 overflow-hidden transition-all duration-300",
          "data-[active=true]:bg-foreground"
        )}
        animate={{ scale: isActive ? 1.02 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <SkillsGrid skills={skills} />
      </motion.div>

      {/* NEW: The legend is now placed here, underneath the skills grid */}
      <div className="mt-8">
        <ProficiencyLegend />
      </div>
    </section>
  );
}
