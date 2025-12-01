"use client";

import { getMediaUrl } from "@/lib/payload-helpers";
import { useEffect, useState } from "react";
import Image from "next/image";

interface SkillIconProps {
  className?: string;
  iconClassName?: string | null;
  svgIconUrl?: string | null;
  altText?: string | null;
}

// This component fetches SVG content and renders it inline for styling.
export function SkillIcon({
  className,
  iconClassName,
  svgIconUrl,
  altText,
}: SkillIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    if (svgIconUrl) {
      const fullUrl = getMediaUrl(svgIconUrl);
      if (fullUrl) {
        // Fetch the raw SVG content from the URL
        fetch(fullUrl)
          .then((res) => res.text())
          .then((text) => {
            // Basic sanitization to remove scripts, just in case
            const sanitized = text.replace(
              /<script\b[^>]*>[\s\S]*?<\/script\b[^>]*>/gi,
              ""
            );
            setSvgContent(sanitized);
          })
          .catch(console.error);
      }
    }
  }, [svgIconUrl]);

  // If a Devicon class is provided, render the <i> tag
  if (iconClassName) {
    return <i className={`${className} ${iconClassName}`} />;
  }

  // If we have fetched SVG content, render it inline
  if (svgContent) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  // If an SVG URL is provided but not yet loaded, show a placeholder or an Image fallback.
  // Using Next/Image here is a good fallback for non-SVG files or loading states.
  if (svgIconUrl) {
    const fullUrl = getMediaUrl(svgIconUrl);
    return fullUrl ? (
      <Image
        src={fullUrl}
        alt={altText || "Skill icon"}
        width={20}
        height={20}
        className={className}
      />
    ) : null;
  }

  // If no icon is provided at all, render an empty div to maintain layout
  return <div className={className} />;
}
