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
    // UPDATED: This is now a regular div, no staggered animation
    <div className="flex flex-wrap justify-center gap-8">
      {skills.map((category: SkillCategory) => (
        // UPDATED: Changed back to a simple div, removing motion props
        <div
          key={category.category}
          className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.34rem)] xl:w-[calc(20%-1.6rem)]"
        >
          {/* The rest of the component remains the same, with the bouncy hover animation intact */}
          <Card className="h-full border-0 shadow-none bg-transparent hover:shadow-none flex flex-col items-center">
            <CardHeader className="flex justify-center items-center px-6 pt-6 pb-3">
              <CardTitle className="text-2xl text-center transition-colors duration-300 group-data-[active=true]:text-background">
                {category.category}
              </CardTitle>
            </CardHeader>
            <Separator className="w-2/4 mx-auto group-data-[active=true]:bg-background/20" />
            <CardContent className="w-full p-4 pt-3 flex justify-center">
              <div className="inline-grid grid-cols-2 gap-0">
                {category.skills.map((skill: Skill) => (
                  <div
                    key={skill.name}
                    className="relative group/skill flex h-16 w-16 items-center justify-center"
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
                      className="flex cursor-pointer items-center justify-center rounded-lg transition-colors duration-200 
                                 group-hover/skill:absolute group-hover/skill:z-10 group-hover/skill:h-auto group-hover/skill:w-auto 
                                 group-hover/skill:p-3 group-hover/skill:shadow-lg
                                 group-hover/skill:bg-foreground group-data-[active=true]:group-hover/skill:bg-background"
                    >
                      {/* ... rest of the skill item */}
                      <div className="flex flex-col items-center gap-1.5">
                        <SkillIcon
                          iconClassName={skill.iconClassName}
                          svgIconUrl={skill.svgIcon?.url}
                          altText={skill.name}
                          className="h-8 w-8 flex shrink-0 items-center justify-center text-2xl text-foreground transition-colors duration-200 
                                     group-hover/skill:text-background group-data-[active=true]:text-background group-data-[active=true]:group-hover/skill:text-foreground 
                                     [&>svg]:h-7 [&>svg]:w-7"
                        />
                        <div className="hidden group-hover/skill:flex flex-col items-center gap-1">
                          <span className="whitespace-nowrap block text-center text-xs font-semibold text-background group-data-[active=true]:text-foreground">
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
