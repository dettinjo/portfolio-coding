// src/components/sections/software/ProjectsSection.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { SoftwareProject } from "@/lib/payload-types-shared";
import { AnimatedProjectCard } from "./AnimatedProjectCard";

interface ProjectsSectionProps {
  projects: SoftwareProject[];
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

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section id="projekte">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold tracking-tight">{t("title")}</h2>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* UPDATED: We use a simple div here as the wrapper */}
      <div className="grid grid-cols-1 gap-16">
        {projects.map((project, index) => (
          // The AnimatedProjectCard component itself will handle its own scaling
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
    </section>
  );
}
