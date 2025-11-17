// src/components/ProficiencyBar.tsx
"use client";

import { cn } from "@/lib/utils";

interface ProficiencyBarProps {
  level: number;
  maxLevel?: number;
  className?: string;
}

export function ProficiencyBar({
  level,
  maxLevel = 5,
  className,
}: ProficiencyBarProps) {
  const percentage = (level / maxLevel) * 100;

  return (
    <div
      className={cn(
        "h-1.5 w-16 rounded-full transition-colors duration-200",
        // --- THIS IS THE FIX (Track) ---
        // Default State
        "bg-foreground/20",
        // Active State
        "group-data-[active=true]:bg-background/30",
        // Default + Hover State
        "group-hover/skill:bg-background/20",
        // Active + Hover State
        "group-data-[active=true]:group-hover/skill:bg-foreground/30",
        // -----------------------------
        className
      )}
      aria-label={`Proficiency: ${level} out of ${maxLevel}`}
    >
      <div
        className={cn(
          "h-full rounded-full transition-colors duration-200",
          // --- THIS IS THE FIX (Fill) ---
          // Default State
          "bg-foreground",
          // Active State
          "group-data-[active=true]:bg-background",
          // Default + Hover State
          "group-hover/skill:bg-background",
          // Active + Hover State
          "group-data-[active=true]:group-hover/skill:bg-foreground"
          // ----------------------------
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
