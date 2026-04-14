"use client";

import { getMediaUrl } from "@/lib/payload-helpers";
import Image from "next/image";

interface SkillIconProps {
  className?: string;
  iconClassName?: string | null;
  svgIconUrl?: string | null;
  altText?: string | null;
}

export function SkillIcon({
  className,
  iconClassName,
  svgIconUrl,
  altText,
}: SkillIconProps) {
  // Devicon CSS class icon (font-based)
  if (iconClassName) {
    return <i className={`${className} ${iconClassName}`} />;
  }

  // Custom SVG from Payload — use Next/Image directly (no per-icon fetch waterfall)
  if (svgIconUrl) {
    const fullUrl = getMediaUrl(svgIconUrl);
    return fullUrl ? (
      <Image
        src={fullUrl}
        alt={altText || "Skill icon"}
        width={32}
        height={32}
        className={className}
        unoptimized
      />
    ) : null;
  }

  return <div className={className} />;
}
