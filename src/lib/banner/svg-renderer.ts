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
  return String(unsafe || "")
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
        statusDot: "#22c55e", // emerald-500
      }
    : {
        bg: "#fafafa", // hsl(240 10% 98%)
        fg: "#18181b", // hsl(240 10% 10%)
        border: "#e4e4e7", // hsl(240 10% 85%)
        badgeBg: "#f4f4f5", // hsl(240 5% 90%)
        badgeFg: "#18181b", // hsl(240 10% 10%)
        prompt: "#71717a", // hsl(240 5% 45%) - subtle muted prompt
        statusDot: "#16a34a", // emerald-600
      };

  const safeJobTitle = escapeXml(data.jobTitle || "AI Engineer");
  const isTitleOnly = data.template === "title-only";
  const hasSkills = !isTitleOnly && Array.isArray(data.skills) && data.skills.length > 0;
  const skills = hasSkills ? data.skills.slice(0, 8) : [];
  const tagStyle = data.tagStyle || "block";

  const showTagline = Boolean(data.showTagline && data.tagline?.trim());
  const safeTagline = escapeXml(data.tagline || "");

  const showStatus = Boolean(data.showStatus && data.statusText?.trim());
  const safeStatusText = escapeXml(data.statusText || "");

  const showContact = Boolean(data.showContact && data.contactUrl?.trim());
  const safeContactUrl = escapeXml(data.contactUrl || "");

  // Exact monospace font stack
  const fontMono =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  // Layout calculations:
  // LinkedIn dimensions: 1584 x 396 px
  // Left clearance: x = 380px ensures 100% avoidance of LinkedIn's desktop circular avatar
  const startX = 380;

  // Vertical placement
  let titleY = 182;
  let taglineY = 138;
  let badgesY = 230;

  if (isTitleOnly) {
    titleY = 216;
  } else if (showTagline) {
    titleY = 192;
    taglineY = 144;
    badgesY = 242;
  }

  // Prompt prefix resolution
  let promptStr = "";
  if (data.template === "terminal") {
    const symbol = data.promptSymbol || ">";
    if (symbol === ">") {
      promptStr = `<tspan fill="${colors.prompt}">&gt; </tspan>`;
    } else if (symbol === "$") {
      promptStr = `<tspan fill="${colors.prompt}">$ </tspan>`;
    } else if (symbol === "❯") {
      promptStr = `<tspan fill="${colors.prompt}">&#10095; </tspan>`;
    }
  }

  // 1. Title SVG
  const titleSvg = `
    <!-- Terminal Title Line with cursor block -->
    <g id="terminal-title">
      <text x="${startX}" y="${titleY}" xml:space="preserve" font-family="${fontMono}" font-size="52" font-weight="700" letter-spacing="-0.02em">${promptStr}<tspan fill="${colors.fg}">${safeJobTitle}</tspan><tspan dx="8" fill="${colors.fg}">&#9608;</tspan></text>
    </g>`;

  // 2. Optional Tagline (Code comment style)
  let taglineSvg = "";
  if (showTagline) {
    taglineSvg = `
    <!-- Terminal Comment / Tagline -->
    <g id="terminal-tagline">
      <text x="${startX}" y="${taglineY}" font-family="${fontMono}" font-size="16" font-weight="500" fill="${colors.prompt}"># ${safeTagline}</text>
    </g>`;
  }

  // 3. Skill Tags SVG (Modern Terminal Style)
  let badgesSvg = "";
  if (hasSkills) {
    if (tagStyle === "block") {
      // Modern terminal rectangular chips (rx="3", crisp monospace)
      let curX = startX;
      const rendered = skills
        .map((skill) => {
          const text = escapeXml(skill);
          const itemWidth = Math.round(text.length * 8.2) + 20;
          const x = curX;
          curX += itemWidth + 8;
          return `
      <g transform="translate(${x}, ${badgesY})">
        <rect width="${itemWidth}" height="28" rx="3" fill="${colors.badgeBg}" stroke="${colors.border}" stroke-width="1" />
        <text x="${itemWidth / 2}" y="18" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.badgeFg}">
          ${text}
        </text>
      </g>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Terminal Code Tag Blocks -->\n    <g id="skill-badges">${rendered}\n    </g>`;
    } else if (tagStyle === "bracket") {
      // Bracketed code array tokens: [ Python ] [ PyTorch ]
      let curX = startX;
      const rendered = skills
        .map((skill) => {
          const text = escapeXml(skill);
          const textLen = Math.round((text.length + 4) * 8.5);
          const x = curX;
          curX += textLen + 10;
          return `
      <g transform="translate(${x}, ${badgesY + 18})">
        <text font-family="${fontMono}" font-size="14" font-weight="500">
          <tspan fill="${colors.prompt}">[ </tspan><tspan fill="${colors.fg}">${text}</tspan><tspan fill="${colors.prompt}"> ]</tspan>
        </text>
      </g>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Terminal Bracket Tokens -->\n    <g id="skill-badges">${rendered}\n    </g>`;
    } else if (tagStyle === "inline") {
      // Minimalist terminal pipeline: $ stack: Python · PyTorch · Docker
      badgesSvg = `
    <!-- Terminal Inline Pipeline -->
    <g id="skill-badges" transform="translate(${startX}, ${badgesY + 18})">
      <text font-family="${fontMono}" font-size="14" font-weight="500">
        <tspan fill="${colors.prompt}">$ stack: </tspan>
        ${skills
          .map(
            (s, idx) =>
              `<tspan fill="${colors.fg}">${escapeXml(s)}</tspan>${
                idx < skills.length - 1
                  ? `<tspan fill="${colors.prompt}">  &#183;  </tspan>`
                  : ""
              }`
          )
          .join("")}
      </text>
    </g>`;
    }
  }

  // 4. Optional Status (tmux / statusline style)
  let statusSvg = "";
  if (showStatus) {
    const textWidth = Math.round(safeStatusText.length * 8.5);
    statusSvg = `
    <!-- Terminal Statusline Indicator -->
    <g id="terminal-status" transform="translate(1504, 60)" text-anchor="end">
      <circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="${colors.statusDot}" />
      <text font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.prompt}">${safeStatusText}</text>
    </g>`;
  }

  // 5. Optional Handle / URL (terminal path)
  let contactSvg = "";
  if (showContact) {
    contactSvg = `
    <!-- Terminal Path / Handle -->
    <g id="terminal-handle" transform="translate(1504, 345)" text-anchor="end">
      <text font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.prompt}">~/ ${safeContactUrl}</text>
    </g>`;
  }

  // 6. Optional LinkedIn Safe Area Guides Overlay
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
    ${statusSvg}
    ${taglineSvg}
    ${titleSvg}
    ${badgesSvg}
    ${contactSvg}
    ${safeAreaOverlay}
  </svg>`;
}
