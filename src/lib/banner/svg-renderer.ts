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

  // Palette mapped strictly to the portfolio's color scheme
  const colors = isDark
    ? {
        bg: "#18181b", // hsl(240 5.9% 10%)
        cardBg: "#202024",
        subtleBg: "#141416",
        fg: "#fafafa", // hsl(240 10% 98%)
        fgMuted: "#a1a1aa", // hsl(240 5% 65%)
        border: "#3f3f46", // hsl(240 5% 30%)
        borderSubtle: "#27272a",
        badgeBg: "#27272a",
        badgeFg: "#e4e4e7",
        badgeBorder: "#3f3f46",
        dotGrid: "#27272a",
        dotAccent: "#10b981",
        dotAccentBg: "rgba(16, 185, 129, 0.15)",
        glow1: "rgba(99, 102, 241, 0.16)",
        glow2: "rgba(16, 185, 129, 0.08)",
      }
    : {
        bg: "#fafafa", // hsl(240 10% 98%)
        cardBg: "#ffffff",
        subtleBg: "#f4f4f5",
        fg: "#18181b", // hsl(240 10% 10%)
        fgMuted: "#71717a", // hsl(240 5% 45%)
        border: "#e4e4e7", // hsl(240 10% 85%)
        borderSubtle: "#e4e4e7",
        badgeBg: "#f4f4f5",
        badgeFg: "#27272a",
        badgeBorder: "#d4d4d8",
        dotGrid: "#e4e4e7",
        dotAccent: "#059669",
        dotAccentBg: "rgba(5, 150, 105, 0.12)",
        glow1: "rgba(99, 102, 241, 0.09)",
        glow2: "rgba(16, 185, 129, 0.05)",
      };

  const safeName = escapeXml(data.name || "Software Developer");
  const safeJobTitle = escapeXml(data.jobTitle || "Full-Stack Engineer");
  const safeTagline = escapeXml(data.tagline || "");
  const safeContact = escapeXml(data.contactUrl || "");
  const safeStatus = escapeXml(data.statusText || "Available for select roles");
  const skills = (data.skills || []).slice(0, 7);

  // Helper for rendering skills badge pills
  const renderSkillBadges = (
    startX: number,
    startY: number,
    isMonospace: boolean = false
  ) => {
    let currentX = startX;
    return skills
      .map((skill) => {
        const text = escapeXml(skill);
        const charWidth = isMonospace ? 9 : 8;
        const textWidth = text.length * charWidth;
        const badgeWidth = textWidth + 28;
        const badgeHeight = 28;
        const x = currentX;
        currentX += badgeWidth + 10;

        return `
        <g transform="translate(${x}, ${startY})">
          <rect width="${badgeWidth}" height="${badgeHeight}" rx="6" fill="${colors.badgeBg}" stroke="${colors.badgeBorder}" stroke-width="1" />
          <text x="${badgeWidth / 2}" y="18" text-anchor="middle" font-family="${
          isMonospace
            ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }" font-size="13" font-weight="500" fill="${colors.badgeFg}">${text}</text>
        </g>`;
      })
      .join("");
  };

  // Safe area guides overlay if requested
  const safeAreaOverlay = options.showSafeAreas
    ? `
    <!-- LinkedIn Safe Area Guides Overlay -->
    <g id="safe-area-guides" opacity="0.9">
      <!-- Mobile Safe Zone Boundary -->
      <rect x="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minX}" y="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minY}" 
            width="${LINKEDIN_SAFE_AREAS.mobileSafeZone.width}" height="${LINKEDIN_SAFE_AREAS.mobileSafeZone.height}" 
            fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="6 4" />
      <text x="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minX + 12}" y="${LINKEDIN_SAFE_AREAS.mobileSafeZone.minY + 20}" 
            font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#f59e0b" letter-spacing="0.05em">
        MOBILE SAFE BOUNDARY (1260 × 316)
      </text>

      <!-- Desktop Avatar Collision Circle -->
      <circle cx="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerX}" cy="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerY}" 
              r="${LINKEDIN_SAFE_AREAS.desktopAvatar.radius}" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" stroke-width="2" stroke-dasharray="5 3" />
      <text x="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerX}" y="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerY - 10}" 
            text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ef4444">
        PROFILE PHOTO
      </text>
      <text x="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerX}" y="${LINKEDIN_SAFE_AREAS.desktopAvatar.centerY + 8}" 
            text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" font-weight="500" fill="#ef4444">
        (Avatar Safe Zone)
      </text>
    </g>`
    : "";

  let templateContent = "";

  // ─── TEMPLATE 1: TERMINAL MINIMALIST ───────────────────────────────────────
  if (data.template === "terminal") {
    templateContent = `
    <!-- Pattern definitions -->
    <defs>
      <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.2" fill="${colors.dotGrid}" />
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.bg}" />
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="url(#dot-grid)" />

    <!-- Terminal Window Top Bar / Prompt Line -->
    <g transform="translate(380, 52)">
      <!-- Prompt indicator -->
      <text x="0" y="16" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="14" font-weight="600" fill="${colors.fgMuted}">
        <tspan fill="${colors.dotAccent}">❯ </tspan>${safeName.toLowerCase().replace(/\s+/g, ".")}@portfolio:<tspan fill="${colors.fg}">~</tspan>$
      </text>
    </g>

    <!-- Top Right System Badge -->
    <g transform="translate(1410, 52)">
      <text x="0" y="16" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="12" font-weight="500" fill="${colors.fgMuted}" letter-spacing="0.08em">
        SYS_STATUS // ONLINE ●
      </text>
    </g>

    <!-- Job Title with Monospace Cursor -->
    <g transform="translate(380, 138)">
      <text x="0" y="0" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="40" font-weight="700" fill="${colors.fg}" letter-spacing="-0.02em">
        ${safeJobTitle}
      </text>
      <!-- Blinking Terminal Cursor Block -->
      <rect x="${Math.min(safeJobTitle.length * 24.2, 860)}" y="-34" width="16" height="38" fill="${colors.fg}" rx="2">
        <animate attributeName="opacity" values="1;1;0;0;1" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </g>

    <!-- Tagline -->
    <g transform="translate(380, 185)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="${colors.fgMuted}">
        ${safeTagline}
      </text>
    </g>

    <!-- Skills Badges (Monospace Pills) -->
    <g>
      ${renderSkillBadges(380, 222, true)}
    </g>

    <!-- Bottom Metadata Bar -->
    <g transform="translate(380, 320)">
      ${
        data.showStatus && data.statusText
          ? `
      <g>
        <circle cx="6" cy="6" r="4.5" fill="${colors.dotAccent}" />
        <text x="18" y="10" font-family="system-ui, sans-serif" font-size="14" font-weight="500" fill="${colors.fgMuted}">
          ${safeStatus}
        </text>
      </g>`
          : ""
      }

      ${
        safeContact
          ? `
      <g transform="translate(${data.showStatus ? 280 : 0}, 0)">
        <text x="0" y="10" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="14" font-weight="500" fill="${colors.fgMuted}">
          → <tspan fill="${colors.fg}">${safeContact}</tspan>
        </text>
      </g>`
          : ""
      }
    </g>
    `;
  }

  // ─── TEMPLATE 2: ARCHITECTURAL SPLIT ──────────────────────────────────────
  else if (data.template === "split") {
    templateContent = `
    <!-- Background -->
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.bg}" />

    <!-- Left Sub-Zone (Frames the avatar safely) -->
    <rect width="330" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.subtleBg}" />
    <line x1="330" y1="36" x2="330" y2="360" stroke="${colors.border}" stroke-width="1.5" />

    <!-- Left Column Status Pill -->
    ${
      data.showStatus && data.statusText
        ? `
    <g transform="translate(42, 60)">
      <rect width="246" height="32" rx="16" fill="${colors.cardBg}" stroke="${colors.border}" stroke-width="1" />
      <circle cx="16" cy="16" r="4" fill="${colors.dotAccent}" />
      <text x="28" y="20" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${colors.fgMuted}">
        ${safeStatus}
      </text>
    </g>`
        : ""
    }

    <!-- Right Column: Candidate Name in Crisp Caps -->
    <g transform="translate(380, 78)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="700" fill="${colors.fgMuted}" letter-spacing="0.12em">
        ${safeName.toUpperCase()}
      </text>
    </g>

    <!-- Right Column: Primary Job Title Headline -->
    <g transform="translate(380, 142)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="46" font-weight="800" fill="${colors.fg}" letter-spacing="-0.03em">
        ${safeJobTitle}
      </text>
    </g>

    <!-- Right Column: Tagline -->
    <g transform="translate(380, 192)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="${colors.fgMuted}">
        ${safeTagline}
      </text>
    </g>

    <!-- Right Column: Tech Stack Pills -->
    <g>
      ${renderSkillBadges(380, 230, false)}
    </g>

    <!-- Right Column: Website / Contact Badge -->
    ${
      safeContact
        ? `
    <g transform="translate(380, 316)">
      <rect width="${safeContact.length * 8.5 + 44}" height="32" rx="6" fill="${colors.badgeBg}" stroke="${colors.border}" stroke-width="1" />
      <!-- Globe / link icon -->
      <circle cx="18" cy="16" r="5" fill="none" stroke="${colors.fgMuted}" stroke-width="1.2" />
      <line x1="13" y1="16" x2="23" y2="16" stroke="${colors.fgMuted}" stroke-width="1.2" />
      <text x="32" y="20.5" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${colors.fg}">
        ${safeContact}
      </text>
    </g>`
        : ""
    }
    `;
  }

  // ─── TEMPLATE 3: AMBIENT TECH GLOW ─────────────────────────────────────────
  else if (data.template === "glow") {
    templateContent = `
    <defs>
      <!-- Subtle Radial Glow Aura -->
      <radialGradient id="aura1" cx="82%" cy="40%" r="55%">
        <stop offset="0%" stop-color="${colors.glow1}" />
        <stop offset="100%" stop-color="rgba(0,0,0,0)" />
      </radialGradient>
      <radialGradient id="aura2" cx="65%" cy="85%" r="45%">
        <stop offset="0%" stop-color="${colors.glow2}" />
        <stop offset="100%" stop-color="rgba(0,0,0,0)" />
      </radialGradient>
    </defs>

    <!-- Background -->
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.bg}" />
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="url(#aura1)" />
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="url(#aura2)" />

    <!-- Top Badge Strip -->
    <g transform="translate(380, 64)">
      ${
        data.showStatus && data.statusText
          ? `
      <rect width="210" height="28" rx="14" fill="${colors.cardBg}" stroke="${colors.border}" stroke-width="1" />
      <circle cx="14" cy="14" r="3.5" fill="${colors.dotAccent}" />
      <text x="26" y="18" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="${colors.fg}">
        ${safeStatus}
      </text>`
          : ""
      }
      <text x="${data.showStatus ? 230 : 0}" y="18" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${colors.fgMuted}">
        ${safeName}
      </text>
    </g>

    <!-- Main Job Title Headline with High Contrast -->
    <g transform="translate(380, 145)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="48" font-weight="800" fill="${colors.fg}" letter-spacing="-0.03em">
        ${safeJobTitle}
      </text>
    </g>

    <!-- Tagline -->
    <g transform="translate(380, 196)">
      <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="400" fill="${colors.fgMuted}">
        ${safeTagline}
      </text>
    </g>

    <!-- Skills Badges with Soft Contrast -->
    <g>
      ${renderSkillBadges(380, 235, false)}
    </g>

    <!-- Contact Link -->
    ${
      safeContact
        ? `
    <g transform="translate(380, 320)">
      <text x="0" y="0" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${colors.fgMuted}">
        Portfolio: <tspan fill="${colors.fg}">${safeContact}</tspan>
      </text>
    </g>`
        : ""
    }
    `;
  }

  // ─── TEMPLATE 4: FRAMED CARD (SHOWCASE) ────────────────────────────────────
  else {
    templateContent = `
    <!-- Outer Background -->
    <rect width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}" fill="${colors.bg}" />

    <!-- Inset Framed Showcase Card (Right aligned safe from avatar) -->
    <g transform="translate(350, 28)">
      <!-- Card Container -->
      <rect width="1180" height="340" rx="16" fill="${colors.cardBg}" stroke="${colors.border}" stroke-width="1.5" />

      <!-- Card Top Header Bar -->
      <g transform="translate(36, 42)">
        ${
          data.showStatus && data.statusText
            ? `
        <circle cx="4" cy="4" r="4" fill="${colors.dotAccent}" />
        <text x="16" y="8" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="${colors.fgMuted}">
          ${safeStatus}
        </text>`
            : ""
        }
        <text x="1108" y="8" text-anchor="end" font-family="system-ui, sans-serif" font-size="14" font-weight="600" fill="${colors.fgMuted}">
          ${safeName}
        </text>
      </g>

      <!-- Divider line inside card -->
      <line x1="36" y1="62" x2="1144" y2="62" stroke="${colors.border}" stroke-width="1" />

      <!-- Job Title Headline -->
      <g transform="translate(36, 126)">
        <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="800" fill="${colors.fg}" letter-spacing="-0.03em">
          ${safeJobTitle}
        </text>
      </g>

      <!-- Tagline -->
      <g transform="translate(36, 172)">
        <text x="0" y="0" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="400" fill="${colors.fgMuted}">
          ${safeTagline}
        </text>
      </g>

      <!-- Skills Badges inside Card -->
      <g>
        ${renderSkillBadges(36, 215, false)}
      </g>

      <!-- Card Footer URL -->
      ${
        safeContact
          ? `
      <g transform="translate(36, 304)">
        <text x="0" y="0" font-family="ui-monospace, monospace" font-size="13" font-weight="500" fill="${colors.fgMuted}">
          [ <tspan fill="${colors.fg}">${safeContact}</tspan> ]
        </text>
      </g>`
          : ""
      }
    </g>
    `;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LINKEDIN_BANNER_WIDTH} ${LINKEDIN_BANNER_HEIGHT}" width="${LINKEDIN_BANNER_WIDTH}" height="${LINKEDIN_BANNER_HEIGHT}">
    ${templateContent}
    ${safeAreaOverlay}
  </svg>`;
}
