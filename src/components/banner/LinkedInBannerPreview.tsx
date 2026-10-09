"use client";

import { useMemo } from "react";
import { BannerData } from "@/types/banner";
import { renderBannerSvg } from "@/lib/banner/svg-renderer";

interface LinkedInBannerPreviewProps {
  data: BannerData;
  showSafeAreas?: boolean;
  className?: string;
}

export function LinkedInBannerPreview({
  data,
  showSafeAreas = false,
  className = "",
}: LinkedInBannerPreviewProps) {
  const svgString = useMemo(() => {
    return renderBannerSvg(data, { showSafeAreas });
  }, [data, showSafeAreas]);

  return (
    <div className={`relative w-full overflow-hidden rounded-xl border shadow-sm ${className}`}>
      {/* 4:1 aspect ratio container */}
      <div className="relative w-full aspect-[4/1] bg-muted/20 flex items-center justify-center">
        <div
          className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full"
          dangerouslySetInnerHTML={{ __html: svgString }}
        />
      </div>
    </div>
  );
}
