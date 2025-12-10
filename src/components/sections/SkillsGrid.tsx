// src/components/sections/software/SkillsGrid.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillIcon } from "@/components/SkillIcon";
import { Separator } from "@/components/ui/separator";
import { ProficiencyBar } from "@/components/ProficiencyBar";
import { useState, useEffect } from "react";

// --- Interfaces ---
interface Skill {
  name: string;
  iconClassName: string | null;
  level: number;
  url: string;
  svgIcon?: { url: string; alternativeText?: string } | null;
}
interface SkillCategory {
  category: string;
  skills: Skill[];
}
interface SkillsGridProps {
  skills: SkillCategory[];
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

function SkillItem({ skill }: { skill: Skill }) {
  const [isHovered, setIsHovered] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1280px)"); // xl breakpoint

  // On mobile (!isDesktop), content is always valid.
  // On desktop, content is valid if hovered.
  const showDetails = !isDesktop || isHovered;

  return (
    <div
      key={skill.name}
      className="relative group/skill flex items-center justify-center 
                 xl:h-16 xl:w-16"
    >
      <motion.a
        href={skill.url}
        target="_blank"
        rel="noopener noreferrer"
        layout
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        transition={{
          layout: {
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.5,
          },
        }}
        className="flex h-full w-full cursor-pointer items-center justify-center rounded-lg p-2 transition-colors duration-200 
                   hover:bg-foreground group-data-[active=true]:hover:bg-background
                   xl:h-16 xl:w-16 xl:p-0 xl:hover:bg-transparent xl:group-data-[active=true]:hover:bg-transparent
                   xl:group-hover/skill:absolute xl:group-hover/skill:z-10 xl:group-hover/skill:h-auto xl:group-hover/skill:w-auto 
                   xl:group-hover/skill:p-3 xl:group-hover/skill:shadow-lg
                   xl:group-hover/skill:bg-foreground xl:group-data-[active=true]:group-hover/skill:bg-background"
      >
        <div className="flex w-full flex-col items-center gap-1.5">
          <SkillIcon
            iconClassName={skill.iconClassName}
            svgIconUrl={skill.svgIcon?.url}
            altText={skill.name}
            className="h-8 w-8 flex shrink-0 items-center justify-center text-2xl text-foreground transition-colors duration-200 
                       group-hover/skill:text-background
                       group-data-[active=true]:text-background 
                       group-data-[active=true]:group-hover/skill:text-foreground
                       xl:group-hover/skill:text-background 
                       group-data-[active=true]:xl:group-hover/skill:text-foreground 
                       [&>svg]:h-7 [&>svg]:w-7"
          />
          <AnimatePresence>
            {showDetails && (
              <motion.div
                className="flex w-full flex-col items-center gap-1 overflow-hidden"
                initial={
                  !isDesktop
                    ? { opacity: 1, height: "auto" }
                    : { opacity: 0, height: 0 }
                }
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
              >
                <span
                  className="whitespace-normal block text-center text-xs font-semibold text-foreground 
                             group-data-[active=true]:text-background
                             group-hover/skill:text-background
                             group-data-[active=true]:group-hover/skill:text-foreground
                             xl:whitespace-nowrap xl:text-background 
                             xl:group-data-[active=true]:text-foreground"
                >
                  {skill.name}
                </span>
                <ProficiencyBar level={skill.level} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.a>
    </div>
  );
}

export function SkillsGrid({ skills }: SkillsGridProps) {
  if (!skills || skills.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        No skills are currently available.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-8">
      {skills.map((category: SkillCategory) => (
        <div
          key={category.category}
          className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)] xl:w-[calc(20%-1.6rem)]"
        >
          <Card className="h-full border-0 shadow-none bg-transparent hover:shadow-none flex flex-col items-center">
            <CardHeader className="flex justify-center items-center px-6 pt-6 pb-3">
              <CardTitle className="text-2xl text-center transition-colors duration-300 group-data-[active=true]:text-background">
                {category.category}
              </CardTitle>
            </CardHeader>
            <Separator className="w-2/4 mx-auto group-data-[active=true]:bg-background/20" />
            <CardContent className="w-full p-4 pt-3 flex justify-center">
              <div className="inline-grid grid-cols-2 gap-2 xl:gap-0">
                {category.skills.map((skill: Skill) => (
                  <SkillItem key={skill.name} skill={skill} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
