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
  skills: SkillCategory[] | null;
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  const t = useTranslations("software.SoftwareSkillsSection");

  return (
    <section id="skills">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold tracking-tight">{t("title")}</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {skills === null ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h3 className="text-xl font-semibold text-destructive">
            {t("connectionFailedTitle")}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t("connectionFailedMessage")}
          </p>
        </div>
      ) : skills.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-xl font-semibold">{t("emptyTitle")}</h3>
          <p className="mt-2 text-muted-foreground">{t("emptyMessage")}</p>
        </div>
      ) : (
        <SkillsContent skills={skills} />
      )}
    </section>
  );
}

function SkillsContent({ skills }: { skills: SkillCategory[] }) {
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
    <div ref={sectionRef}>
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

      <div className="mt-8">
        <ProficiencyLegend />
      </div>
    </div>
  );
}
