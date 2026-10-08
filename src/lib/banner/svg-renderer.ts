import { BannerData } from "@/types/banner";
import {
  LINKEDIN_BANNER_WIDTH,
  LINKEDIN_BANNER_HEIGHT,
  LINKEDIN_SAFE_AREAS,
} from "./constants";

export interface SvgRenderOptions {
  showSafeAreas?: boolean;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderBannerSvg(
  data: BannerData,
  options: SvgRenderOptions = {}
): string {
  const isDark = data.theme === "dark";

  // Exact colors from src/app/globals.css
  // :root (--background: 240 10% 98%, --foreground: 240 10% 10%, --border: 240 10% 85%, --secondary: 240 5% 90%)
  // .dark (--background: 240 5.9% 10%, --foreground: 240 10% 98%, --border: 240 5% 30%, --secondary: 240 5% 20%)
  const colors = isDark
    ? {
        bg: "#18181b", // hsl(240 5.9% 10%)
        fg: "#fafafa", // hsl(240 10% 98%)
        border: "#3f3f46", // hsl(240 5% 30%)
        badgeBg: "#27272a", // hsl(240 5% 20%)
        badgeFg: "#fafafa", // hsl(240 10% 98%)
        prompt: "#a1a1aa", // hsl(240 5% 65%) - subtle muted prompt
      }
    : {
        bg: "#fafafa", // hsl(240 10% 98%)
        fg: "#18181b", // hsl(240 10% 10%)
        border: "#e4e4e7", // hsl(240 10% 85%)
        badgeBg: "#f4f4f5", // hsl(240 5% 90%)
        badgeFg: "#18181b", // hsl(240 10% 10%)
        prompt: "#71717a", // hsl(240 5% 45%) - subtle muted prompt
      };

  const safeJobTitle = escapeXml(data.jobTitle || "AI Engineer");
  const isTitleOnly = data.template === "title-only";
  const hasSkills = !isTitleOnly && Array.isArray(data.skills) && data.skills.length > 0;
  const skills = hasSkills ? data.skills.slice(0, 8) : [];

  // Exact font stacks from tailwind.config.ts / next.js layout
  const fontMono =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  // Layout calculations:
  // LinkedIn dimensions: 1584 x 396 px
  // Left clearance: x = 380px ensures 100% avoidance of LinkedIn's desktop circular avatar
  const startX = 380;

  // Title vertical position
  // If skills are present: title at y = 180 and badges at y = 226
  // If skills are absent or title-only: title is centered at y = 216
  const titleY = hasSkills ? 180 : 216;

  // Show prompt only for terminal style (hidden for terminal-clean and clean)
  const showPrompt = data.template === "terminal";

  // Skill badge pills rendering (styled identical to src/components/ui/badge.tsx)
  let badgesContent = "";
  if (hasSkills) {
    const badgeY = 226;
    const badgeHeight = 30;
    let currentBadgeX = startX;

    const renderedBadges = skills
      .map((skill) => {
        const text = escapeXml(skill);
        // Estimate badge width: ~8.2px per char in 13px mono font + 24px horizontal padding (px-2.5)
        const itemWidth = Math.round(text.length * 8.2) + 24;
        const x = currentBadgeX;
        currentBadgeX += itemWidth + 10;

        return `
      <g transform="translate(${x}, ${badgeY})">
        <rect width="${itemWidth}" height="${badgeHeight}" rx="15" fill="${colors.badgeBg}" stroke="${colors.border}" stroke-width="1" />
        <text x="${itemWidth / 2}" y="19" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.badgeFg}">
          ${text}
        </text>
      </g>`;
      })
      .join("");

    badgesContent = `<g id="skill-badges">${renderedBadges}\n    </g>`;
  }

  // Optional LinkedIn Safe Area Guides Overlay
  const safeAreaOverlay = options.showSafeAreas
    ? `
    <!-- LinkedIn Safe Area Overlay Guide -->
    <g id="safe-area-guides" opacity="0.85">
      <rect x="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minX}" y="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minY}" 
            width="${LINKEDIN_SAFE_AREAS.mobileSafeZone.width}" height="${LINKEDIN_SAFE_AREAS.mobileSafeZone.height}" 
            fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 4" />
      <circle cx="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerX}" cy="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerY}" 
              r="${LINKEDIN_SAFE_AREAS.desktopAvatar.radius}" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" stroke-width="2" stroke-dasharray="5 3" />
    </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LINKEDIN_BANNER_WIDTH} ${LINKEDIN_BANNER_HEIGHT}" width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}">
    <!-- Background: exact portfolio color -->
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.bg}" />

    <!-- Terminal Title Line with inline prompt and block cursor -->
    <g id="terminal-title">
      <text x="${startX}" y="${titleY}" xml:space="preserve" font-family="${fontMono}" font-size="52" font-weight="700" letter-spacing="-0.02em">${showPrompt ? `<tspan fill="${colors.prompt}">&gt; </tspan>` : ""}<tspan fill="${colors.fg}">${safeJobTitle}</tspan><tspan dx="6" fill="${colors.fg}">&#9608;</tspan></text>
    </g>

    <!-- Optional Skill Badges (matches badge.tsx) -->
    ${badgesContent}

    ${safeAreaOverlay}
  </svg>`;
}
