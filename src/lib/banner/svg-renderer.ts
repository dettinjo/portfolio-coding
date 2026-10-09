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

  // Exact monospace font stack
  const fontMono =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  // Left clearance: x = 380px ensures 100% avoidance of LinkedIn's desktop circular avatar
  const startX = 380;

  // Active Building Blocks
  const isTitleOnly = data.template === "title-only";

  const showName = Boolean(data.showName !== false && data.name?.trim());
  const safeName = escapeXml(data.name || "");
  const nameStyle = data.nameStyle || "path";

  const showJobTitle = Boolean(data.showJobTitle !== false && data.jobTitle?.trim());
  const safeJobTitle = escapeXml(data.jobTitle || "AI Engineer");

  const showSkills = !isTitleOnly && Boolean(data.showSkills !== false && data.skills && data.skills.length > 0);
  const skills = showSkills ? data.skills.slice(0, 8) : [];
  const tagStyle = data.tagStyle || "block";

  const showContact = Boolean(data.showContact && data.contactUrl?.trim());
  const safeContactUrl = escapeXml(data.contactUrl || "");
  const linkPosition = data.linkPosition || "below";
  const hasInlineLink = showContact && linkPosition === "below";

  const showTagline = !isTitleOnly && Boolean(data.showTagline && data.tagline?.trim());
  const safeTagline = escapeXml(data.tagline || "");

  const showStatus = Boolean(data.showStatus && data.statusText?.trim());
  const safeStatusText = escapeXml(data.statusText || "");

  // Dynamic vertical centering of the main content stack
  let totalStackHeight = 0;
  if (showTagline) totalStackHeight += 24;
  if (showName) totalStackHeight += 28;
  if (showJobTitle) totalStackHeight += isTitleOnly ? 56 : 54;
  if (showSkills) totalStackHeight += 38;
  if (hasInlineLink) totalStackHeight += 24;

  let currentY = Math.round((LINKEDIN_BANNER_HEIGHT - totalStackHeight) / 2) + 20;

  // 1. Tagline Building Block (code comment: # ...)
  let taglineSvg = "";
  if (showTagline) {
    taglineSvg = `
    <!-- Building Block: Tagline Comment -->
    <g id="block-tagline">
      <text x="${startX}" y="${currentY}" font-family="${fontMono}" font-size="16" font-weight="500" fill="${colors.prompt}"># ${safeTagline}</text>
    </g>`;
    currentY += 28;
  }

  // 2. Name Building Block (terminal identity: ~/ Name)
  let nameSvg = "";
  if (showName) {
    const prefix = nameStyle === "path" ? `<tspan fill="${colors.prompt}">~/ </tspan>` : "";
    nameSvg = `
    <!-- Building Block: Name / Identity -->
    <g id="block-name">
      <text x="${startX}" y="${currentY}" xml:space="preserve" font-family="${fontMono}" font-size="22" font-weight="600" letter-spacing="-0.01em">${prefix}<tspan fill="${colors.fg}">${safeName}</tspan></text>
    </g>`;
    currentY += 46;
  }

  // 3. Job Title Building Block (command: > Role █)
  let titleSvg = "";
  if (showJobTitle) {
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

    const titleFontSize = isTitleOnly ? 56 : 50;
    titleSvg = `
    <!-- Building Block: Job Title / Role -->
    <g id="block-title">
      <text x="${startX}" y="${currentY}" xml:space="preserve" font-family="${fontMono}" font-size="${titleFontSize}" font-weight="700" letter-spacing="-0.02em">${promptStr}<tspan fill="${colors.fg}">${safeJobTitle}</tspan><tspan dx="8" fill="${colors.fg}">&#9608;</tspan></text>
    </g>`;
    currentY += 34;
  }

  // 4. Skills & Tech Stack Building Block (blocks, brackets, inline)
  let badgesSvg = "";
  if (showSkills) {
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
      <g transform="translate(${x}, ${currentY})">
        <rect width="${itemWidth}" height="28" rx="3" fill="${colors.badgeBg}" stroke="${colors.border}" stroke-width="1" />
        <text x="${itemWidth / 2}" y="18" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.badgeFg}">
          ${text}
        </text>
      </g>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Blocks) -->\n    <g id="block-skills">${rendered}\n    </g>`;
      currentY += 42;
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
      <g transform="translate(${x}, ${currentY + 18})">
        <text font-family="${fontMono}" font-size="14" font-weight="500">
          <tspan fill="${colors.prompt}">[ </tspan><tspan fill="${colors.fg}">${text}</tspan><tspan fill="${colors.prompt}"> ]</tspan>
        </text>
      </g>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Brackets) -->\n    <g id="block-skills">${rendered}\n    </g>`;
      currentY += 40;
    } else if (tagStyle === "inline") {
      // Minimalist terminal pipeline: $ stack: Python · PyTorch · Docker
      badgesSvg = `
    <!-- Building Block: Skills (Inline Pipeline) -->
    <g id="block-skills" transform="translate(${startX}, ${currentY + 18})">
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
      currentY += 40;
    }
  }

  // 5. Portfolio Website / Link Building Block (below stack or corner)
  let linkSvg = "";
  if (showContact) {
    if (linkPosition === "below") {
      linkSvg = `
    <!-- Building Block: Portfolio Link (Below Stack) -->
    <g id="block-link" transform="translate(${startX}, ${currentY + 4})">
      <text font-family="${fontMono}" font-size="15" font-weight="500">
        <tspan fill="${colors.prompt}">&#8599; </tspan><tspan fill="${colors.fg}">${safeContactUrl}</tspan>
      </text>
    </g>`;
    } else {
      linkSvg = `
    <!-- Building Block: Portfolio Link (Corner) -->
    <g id="block-link" transform="translate(1504, 345)" text-anchor="end">
      <text font-family="${fontMono}" font-size="14" font-weight="500">
        <tspan fill="${colors.prompt}">&#8599; </tspan><tspan fill="${colors.fg}">${safeContactUrl}</tspan>
      </text>
    </g>`;
    }
  }

  // 6. Statusline Building Block (tmux / statusline style)
  let statusSvg = "";
  if (showStatus) {
    const textWidth = Math.round(safeStatusText.length * 8.5);
    statusSvg = `
    <!-- Building Block: Statusline Indicator -->
    <g id="block-status" transform="translate(1504, 60)" text-anchor="end">
      <circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="${colors.statusDot}" />
      <text font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.prompt}">${safeStatusText}</text>
    </g>`;
  }

  // 7. Optional LinkedIn Safe Area Guides Overlay
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
    ${nameSvg}
    ${titleSvg}
    ${badgesSvg}
    ${linkSvg}
    ${safeAreaOverlay}
  </svg>`;
}
