// src/components/sections/software/SkillsGrid.tsx
"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkillIcon } from "@/components/SkillIcon";
import { Separator } from "@/components/ui/separator";
import { ProficiencyBar } from "@/components/ProficiencyBar";

// --- Interfaces remain the same ---
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
              {/* --- FIX 1: Add gap-2, remove at xl --- */}
              <div className="inline-grid grid-cols-2 gap-2 xl:gap-0">
                {category.skills.map((skill: Skill) => (
                  <div
                    key={skill.name}
                    /* --- FIX 2: Remove fixed h-16 w-16 --- */
                    className="relative group/skill flex items-center justify-center 
                               xl:h-16 xl:w-16"
                  >
                    <motion.a
                      href={skill.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      layout
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 260,
                          damping: 15,
                          mass: 0.5,
                        },
                      }}
                      /* --- FIX 3: Add w-full, but size to xl --- */
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
                        <div
                          className="flex w-full flex-col items-center gap-1
                                        xl:hidden xl:group-hover/skill:flex"
                        >
                          <span
                            /* --- FIX 4: Allow text to wrap --- */
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
                        </div>
                      </div>
                    </motion.a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
