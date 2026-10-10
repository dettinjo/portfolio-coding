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

  // Exact colors from src/app/globals.css and HeroTerminal / RotatingHeroBio
  const colors = isDark
    ? {
        bg: "#18181b", // hsl(240 5.9% 10%)
        fg: "#fafafa", // hsl(240 10% 98%)
        border: "#3f3f46", // hsl(240 5% 30%)
        badgeBg: "#27272a", // hsl(240 5% 20%)
        badgeFg: "#fafafa", // hsl(240 10% 98%)
        prompt: "#a1a1aa", // hsl(240 5% 65%) - subtle muted prompt tokens/brackets
        promptSymbol: "#34d399", // emerald-400 (matches hero section > prompt)
        statusDot: "#22c55e", // emerald-500
      }
    : {
        bg: "#fafafa", // hsl(240 10% 98%)
        fg: "#18181b", // hsl(240 10% 10%)
        border: "#e4e4e7", // hsl(240 10% 85%)
        badgeBg: "#f4f4f5", // hsl(240 5% 90%)
        badgeFg: "#18181b", // hsl(240 10% 10%)
        prompt: "#71717a", // hsl(240 5% 45%) - subtle muted prompt tokens/brackets
        promptSymbol: "#10b981", // emerald-500 (matches hero section > prompt)
        statusDot: "#16a34a", // emerald-600
      };

  // Exact monospace font stack (Menlo / DejaVu Sans Mono / JetBrains Mono)
  const fontMono =
    "'JetBrains Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'DejaVu Sans Mono', monospace";

  // Universal safe zone alignment (2025/2026 multi-device geometry)
  // Mobile web avatar extends to x=685px; x=700px guarantees 100% clearance across mobile browser, app, and desktop.
  const alignment = data.layoutAlignment || "mobile-safe";
  const isTitleOnly = data.template === "title-only";
  const isCentered = alignment === "center" || isTitleOnly;
  const startX =
    alignment === "desktop-left"
      ? 380
      : isCentered
      ? 1030
      : 700;
  // Right boundary: x=1350 ensures a 30px buffer to the left of the mobile edit/settings button (x=1380)
  const safeRightX = 1350;

  const showName = Boolean(data.showName !== false && data.name?.trim());
  const safeName = escapeXml(data.name || "");
  const nameStyle = data.nameStyle || "path";

  const showJobTitle = Boolean(data.showJobTitle !== false && data.jobTitle?.trim());
  const safeJobTitle = escapeXml(data.jobTitle || "AI Engineer");
  const showCursor = data.showCursor !== false;

  const maxSkills = alignment === "desktop-left" ? 8 : 5;
  const showSkills = !isTitleOnly && Boolean(data.showSkills !== false && data.skills && data.skills.length > 0);
  const skills = showSkills ? data.skills.slice(0, maxSkills) : [];
  const tagStyle = data.tagStyle || "block";

  const showContact = Boolean(data.showContact !== false && data.contactUrl?.trim());
  const rawContactUrl = (data.contactUrl || "")
    .replace(/^https?:\/\//i, "")
    .replace(/^curl\s+(-sL\s+)?/i, "")
    .trim();
  const safeContactUrl = escapeXml(rawContactUrl);
  const linkPosition = data.linkPosition || "below";
  const linkStyle = data.linkStyle || "arrow";
  const hasInlineLink = showContact && linkPosition === "below";

  const showTagline = !isTitleOnly && Boolean(data.showTagline && data.tagline?.trim());
  const safeTagline = escapeXml(data.tagline || "");
  const taglineStyle = data.taglineStyle || "plain";

  const showStatus = Boolean(data.showStatus && data.statusText?.trim());
  const safeStatusText = escapeXml(data.statusText || "");
  const statusIcon = data.statusIcon || "dot-green";

  // Dynamic vertical centering of the main content stack with terminal line rhythms
  let totalStackHeight = 0;
  if (showTagline) totalStackHeight += 26;
  if (showName) totalStackHeight += 46;
  if (showJobTitle) totalStackHeight += isTitleOnly ? 64 : 44;
  if (showSkills) totalStackHeight += tagStyle === "block" ? 34 : 28;
  if (hasInlineLink) totalStackHeight += 28;

  let currentY = Math.round((LINKEDIN_BANNER_HEIGHT - totalStackHeight) / 2) + (showTagline ? 16 : 24);

  const textAnchor = isCentered ? ' text-anchor="middle"' : "";

  // 1. Tagline Building Block (initial plain text or optional # comment)
  let taglineSvg = "";
  if (showTagline) {
    const prefix = taglineStyle === "comment" && !safeTagline.startsWith("#") ? "#&#160;" : "";
    taglineSvg = `
    <!-- Building Block: Tagline -->
    <g id="block-tagline"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="15" font-weight="500" fill="${colors.prompt}">${prefix}${safeTagline}</text></g>`;
    currentY += 26;
  }

  // 2. Name Building Block (terminal identity: ~/ Name)
  let nameSvg = "";
  if (showName) {
    const prefix = nameStyle === "path" ? `<tspan fill="${colors.prompt}">~/&#160;</tspan>` : "";
    nameSvg = `
    <!-- Building Block: Name / Identity -->
    <g id="block-name"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="22" font-weight="600" letter-spacing="-0.01em">${prefix}<tspan fill="${colors.fg}">${safeName}</tspan></text></g>`;
    currentY += 46;
  }

  // 3. Job Title Building Block (command: > Role █ matching Hero section)
  let titleSvg = "";
  if (showJobTitle) {
    let promptStr = "";
    if (data.template === "terminal") {
      const symbol = data.promptSymbol || "❯";
      if (symbol === "❯" || symbol === ">") {
        promptStr = `<tspan fill="${colors.promptSymbol}" font-weight="700">&#10095;&#160;</tspan>`;
      } else if (symbol === "$") {
        promptStr = `<tspan fill="${colors.promptSymbol}" font-weight="700">$&#160;</tspan>`;
      }
    }

    const getJobTitleFontSize = (title: string): number => {
      if (isTitleOnly) return 56;
      const len = title.length;
      if (alignment === "desktop-left") return len > 26 ? 42 : 50;
      if (len <= 14) return 46;
      if (len <= 20) return 42;
      if (len <= 26) return 38;
      if (len <= 32) return 34;
      return 30;
    };
    const titleFontSize = getJobTitleFontSize(safeJobTitle);
    const cursorSvg = showCursor ? `<tspan dx="8" fill="${colors.fg}">&#9608;</tspan>` : "";

    titleSvg = `
    <!-- Building Block: Job Title / Role -->
    <g id="block-title"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="${titleFontSize}" font-weight="700" letter-spacing="-0.02em">${promptStr}<tspan fill="${colors.fg}">${safeJobTitle}</tspan>${cursorSvg}</text></g>`;
    currentY += 44;
  }

  // 4. Skills & Tech Stack Building Block (blocks, brackets, inline, pipe, kv)
  let badgesSvg = "";
  if (showSkills) {
    if (tagStyle === "block") {
      // Modern terminal rectangular chips (rx="3", crisp monospace)
      const itemWidths = skills.map((s) => Math.round((s || "").length * 8.2) + 20);
      const totalWidth = itemWidths.reduce((a, b) => a + b, 0) + (skills.length - 1) * 8;
      let curX = isCentered ? startX - Math.round(totalWidth / 2) : startX;
      const rendered = skills
        .map((skill, idx) => {
          const text = escapeXml(skill);
          const itemWidth = itemWidths[idx];
          const x = curX;
          curX += itemWidth + 8;
          return `<g transform="translate(${x}, ${currentY - 20})"><rect width="${itemWidth}" height="28" rx="3" fill="${colors.badgeBg}" stroke="${colors.border}" stroke-width="1" /><text x="${itemWidth / 2}" y="18" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.badgeFg}">${text}</text></g>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Blocks) -->\n    <g id="block-skills">${rendered}</g>`;
      currentY += 34;
    } else if (tagStyle === "bracket") {
      // Bracketed code array tokens: [ Python ] [ PyTorch ]
      const itemWidths = skills.map((s) => Math.round(((s || "").length + 4) * 8.5) + 10);
      const totalWidth = itemWidths.reduce((a, b) => a + b, 0);
      let curX = isCentered ? startX - Math.round(totalWidth / 2) : startX;
      const rendered = skills
        .map((skill) => {
          const text = escapeXml(skill);
          const rawLength = (skill || "").length;
          const textLen = Math.round((rawLength + 4) * 8.5);
          const x = curX;
          curX += textLen + 10;
          return `<text x="${x}" y="${currentY}" xml:space="preserve" font-family="${fontMono}" font-size="14" font-weight="500"><tspan fill="${colors.prompt}">[&#160;</tspan><tspan fill="${colors.fg}">${text}</tspan><tspan fill="${colors.prompt}">&#160;]</tspan></text>`;
        })
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Brackets) -->\n    <g id="block-skills">${rendered}</g>`;
      currentY += 28;
    } else if (tagStyle === "pipe") {
      // Unix pipeline stream: Python | PyTorch | Docker
      const rendered = skills
        .map(
          (s, idx) =>
            `<tspan fill="${colors.fg}">${escapeXml(s)}</tspan>${
              idx < skills.length - 1
                ? `<tspan fill="${colors.prompt}">&#160;&#160;|&#160;&#160;</tspan>`
                : ""
            }`
        )
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Pipe Stream) -->\n    <g id="block-skills"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="14" font-weight="500">${rendered}</text></g>`;
      currentY += 28;
    } else if (tagStyle === "kv") {
      // Neofetch / Fastfetch key-value info: stack: Python · PyTorch · Docker
      const rendered = skills
        .map(
          (s, idx) =>
            `<tspan fill="${colors.fg}">${escapeXml(s)}</tspan>${
              idx < skills.length - 1
                ? `<tspan fill="${colors.prompt}">&#160;&#183;&#160;</tspan>`
                : ""
            }`
        )
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Key-Value) -->\n    <g id="block-skills"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="14" font-weight="500"><tspan fill="${colors.prompt}">stack:&#160;</tspan>${rendered}</text></g>`;
      currentY += 28;
    } else {
      // Minimalist terminal pipeline: Python · PyTorch · Docker
      const rendered = skills
        .map(
          (s, idx) =>
            `<tspan fill="${colors.fg}">${escapeXml(s)}</tspan>${
              idx < skills.length - 1
                ? `<tspan fill="${colors.prompt}">&#160;&#183;&#160;</tspan>`
                : ""
            }`
        )
        .join("");
      badgesSvg = `\n    <!-- Building Block: Skills (Inline Pipeline) -->\n    <g id="block-skills"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="14" font-weight="500">${rendered}</text></g>`;
      currentY += 28;
    }
  }

  // Helper to format link text according to linkStyle
  const renderLinkText = () => {
    if (linkStyle === "curl") {
      return `<tspan fill="${colors.promptSymbol}" font-weight="700">curl -sL&#160;</tspan><tspan fill="${colors.fg}">${safeContactUrl}</tspan>`;
    }
    if (linkStyle === "kv") {
      return `<tspan fill="${colors.prompt}">web:&#160;</tspan><tspan fill="${colors.fg}">${safeContactUrl}</tspan>`;
    }
    if (linkStyle === "plain") {
      return `<tspan fill="${colors.fg}">${safeContactUrl}</tspan>`;
    }
    // Default: arrow
    return `<tspan fill="${colors.prompt}">&#8599;&#160;</tspan><tspan fill="${colors.fg}">${safeContactUrl}</tspan>`;
  };

  // 5. Portfolio Website / Link Building Block (below stack or corner)
  let linkSvg = "";
  if (showContact) {
    if (linkPosition === "below") {
      linkSvg = `\n    <!-- Building Block: Portfolio Link (Below Stack) -->\n    <g id="block-link"><text x="${startX}" y="${currentY}"${textAnchor} xml:space="preserve" font-family="${fontMono}" font-size="15" font-weight="500">${renderLinkText()}</text></g>`;
    } else {
      linkSvg = `\n    <!-- Building Block: Portfolio Link (Safe Corner) -->\n    <g id="block-link"><text x="${safeRightX}" y="345" text-anchor="end" xml:space="preserve" font-family="${fontMono}" font-size="14" font-weight="500">${renderLinkText()}</text></g>`;
    }
  }

  // 6. Statusline Building Block (strictly inside safe zone bounds: x <= 1350, y = 60)
  let statusSvg = "";
  if (showStatus) {
    const textWidth = Math.round(safeStatusText.length * 8.4);
    let iconElement = "";

    if (statusIcon === "dot-green") {
      iconElement = `<circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="#22c55e" />`;
    } else if (statusIcon === "dot-amber") {
      iconElement = `<circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="#f59e0b" />`;
    } else if (statusIcon === "dot-blue") {
      iconElement = `<circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="#06b6d4" />`;
    } else if (statusIcon === "ring") {
      iconElement = `<circle cx="-${textWidth + 12}" cy="-4" r="4.5" fill="none" stroke="${colors.prompt}" stroke-width="1.5" />`;
    } else if (statusIcon === "sparkle") {
      iconElement = `<text x="-${textWidth + 14}" y="0" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="700" fill="#a855f7">&#10022;</text>`;
    } else if (statusIcon === "bolt") {
      iconElement = `<text x="-${textWidth + 14}" y="0" text-anchor="middle" font-family="${fontMono}" font-size="13" fill="#eab308">&#9889;</text>`;
    } else if (statusIcon === "chevron") {
      iconElement = `<text x="-${textWidth + 14}" y="0" text-anchor="middle" font-family="${fontMono}" font-size="13" font-weight="700" fill="${colors.promptSymbol}">&#10095;</text>`;
    }
    // "none" renders no icon element

    statusSvg = `
    <!-- Building Block: Statusline Indicator (Safe Zone Top Right) -->
    <g id="block-status" transform="translate(${safeRightX}, 60)" text-anchor="end">
      ${iconElement}
      <text xml:space="preserve" font-family="${fontMono}" font-size="13" font-weight="500" fill="${colors.prompt}">${safeStatusText}</text>
    </g>`;
  }

  // 7. Optional LinkedIn Safe Area Guides Overlay (Multi-Device Visual Specification)
  const safeAreaOverlay = options.showSafeAreas
    ? `
    <!-- LinkedIn Safe Area Overlay Guide -->
    <g id="safe-area-guides" opacity="0.9">
      <!-- 1. Universal Safe Zone: 100% visible on Mobile Browser, Mobile App & Desktop -->
      <rect x="${LINKEDIN_SAFE_AREAS.universalSafeZone.minX}" y="${LINKEDIN_SAFE_AREAS.universalSafeZone.minY}" 
            width="${LINKEDIN_SAFE_AREAS.universalSafeZone.width}" height="${LINKEDIN_SAFE_AREAS.universalSafeZone.height}" 
            rx="6" fill="rgba(16, 185, 129, 0.05)" stroke="#10b981" stroke-width="2" stroke-dasharray="6 4" />
      <text x="${LINKEDIN_SAFE_AREAS.universalSafeZone.minX + 12}" y="${LINKEDIN_SAFE_AREAS.universalSafeZone.minY + 22}" 
            font-family="${fontMono}" font-size="11" font-weight="700" fill="#10b981">✓ UNIVERSAL SAFE ZONE (Mobile Browser, App &amp; Desktop)</text>

      <!-- 2. Mobile Web Browser Avatar: Chrome/Safari danger circle -->
      <circle cx="${LINKEDIN_SAFE_AREAS.mobileWebAvatar.centerX}" cy="${LINKEDIN_SAFE_AREAS.mobileWebAvatar.centerY}" 
              r="${LINKEDIN_SAFE_AREAS.mobileWebAvatar.radius}" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" stroke-width="2" stroke-dasharray="6 3" />
      <text x="360" y="140" text-anchor="middle" font-family="${fontMono}" font-size="11" font-weight="600" fill="#c084fc">Mobile Web Avatar (Chrome/Safari)</text>

      <!-- 3. Mobile Native App Avatar: App danger circle -->
      <circle cx="${LINKEDIN_SAFE_AREAS.mobileAppAvatar.centerX}" cy="${LINKEDIN_SAFE_AREAS.mobileAppAvatar.centerY}" 
              r="${LINKEDIN_SAFE_AREAS.mobileAppAvatar.radius}" fill="rgba(245, 158, 11, 0.06)" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 3" />
      <text x="274" y="220" text-anchor="middle" font-family="${fontMono}" font-size="10" font-weight="600" fill="#fbbf24">Mobile App Avatar</text>

      <!-- 4. Desktop Avatar: Classic desktop photo circle -->
      <circle cx="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerX}" cy="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerY}" 
              r="${LINKEDIN_SAFE_AREAS.desktopAvatar.radius}" fill="rgba(239, 68, 68, 0.10)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 2" />
      <text x="165" y="320" text-anchor="middle" font-family="${fontMono}" font-size="10" font-weight="600" fill="#f87171">Desktop Avatar</text>

      <!-- 5. Mobile Action Buttons: Edit pencil / Settings gear danger zone -->
      <rect x="${LINKEDIN_SAFE_AREAS.mobileActions.minX}" y="${LINKEDIN_SAFE_AREAS.mobileActions.minY}" 
            width="${LINKEDIN_SAFE_AREAS.mobileActions.width}" height="${LINKEDIN_SAFE_AREAS.mobileActions.height}" 
            rx="4" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4 3" />
      <text x="${LINKEDIN_SAFE_AREAS.mobileActions.minX + 8}" y="${LINKEDIN_SAFE_AREAS.mobileActions.minY + 20}" 
            font-family="${fontMono}" font-size="10" font-weight="600" fill="#f87171">Mobile Edit/Settings</text>
    </g>`
    : "";

  const fontStyles = `
    <defs>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&amp;display=swap');
        text, tspan {
          font-family: ${fontMono};
        }
      </style>
    </defs>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LINKEDIN_BANNER_WIDTH} ${LINKEDIN_BANNER_HEIGHT}" width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}">
    ${fontStyles}
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
