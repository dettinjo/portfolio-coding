// src/components/sections/software/ProjectsSection.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { SoftwareProject } from "@/lib/payload-types-shared";
import { AnimatedProjectCard } from "./AnimatedProjectCard";

interface ProjectsSectionProps {
  projects: SoftwareProject[] | null;
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  const t = useTranslations("software.SoftwareProjectsSection");
  const [activeCardId, setActiveCardId] = useState<number | null>(null);

  const scrollProgressRef = useRef<Record<string, number>>({});
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const progressValues = scrollProgressRef.current;
          let closestId = null;
          let minDistance = Infinity;

          for (const id in progressValues) {
            const distance = Math.abs(progressValues[id] - 0.5);
            if (distance < minDistance) {
              minDistance = distance;
              closestId = parseInt(id, 10);
            }
          }

          if (activeCardId !== closestId) {
            setActiveCardId(closestId);
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check on load
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCardId]);

  return (
    <section id="projekte">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold tracking-tight">{t("title")}</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {projects === null ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <h3 className="text-xl font-semibold text-destructive">
            {t("connectionFailedTitle")}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {t("connectionFailedMessage")}
          </p>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-xl font-semibold">{t("emptyTitle")}</h3>
          <p className="mt-2 text-muted-foreground">{t("emptyMessage")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-16">
          {projects.map((project, index) => (
            <AnimatedProjectCard
              key={project.id}
              project={project}
              index={index}
              isActive={project.id === activeCardId}
              onScrollProgressChange={(progress) => {
                scrollProgressRef.current[String(project.id)] = progress;
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
