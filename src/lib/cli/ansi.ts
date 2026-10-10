// ANSI terminal styling utilities and escape sequences

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  inverse: "\x1b[7m",

  // Standard colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Bright colors
  gray: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",

  // Background colors
  bgCyan: "\x1b[46m\x1b[30m",
  bgBlue: "\x1b[44m\x1b[37m",
  bgDark: "\x1b[48;5;236m",
};

/**
 * Strips ANSI color and OSC escape codes for plain-text output.
 */
export function stripAnsi(text: string): string {
  return text
    .replace(/\x1b]8;;.*?\x1b\\/g, "") // OSC 8 hyperlinks
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, ""); // ANSI color/style sequences
}

/**
 * Strips HTML tags and decodes common HTML entities for terminal rendering.
 */
export function stripHtml(input: string): string {
  if (!input) return "";

  return input
    // Convert line breaks and paragraph ends
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "  • ")
    // Convert anchor tags with href to label (url) or label
    .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, "")
    // Decode HTML entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    // Normalize consecutive newlines and whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+\n/g, "\n\n")
    .trim();
}

/**
 * Strips markdown links [text](url) to clean display text.
 */
export function cleanMarkdownLinks(input: string): string {
  if (!input) return "";
  return input.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
    if (text === url || url === `mailto:${text}`) {
      return text;
    }
    return text;
  });
}

/**
 * Truncates text so its visible (non-ANSI) character length does not exceed maxLen.
 * If truncated, appends '…'. Preserves leading ANSI color sequences if present.
 */
export function truncateVisible(text: string, maxLen: number): string {
  const visible = stripAnsi(text);
  if (visible.length <= maxLen) return text;
  const truncated = visible.slice(0, Math.max(0, maxLen - 1)) + "…";
  const ansiMatch = text.match(/^(\x1b\[[0-9;]*m)+/);
  if (ansiMatch) {
    return `${ansiMatch[0]}${truncated}${c.reset}`;
  }
  return truncated;
}

/**
 * Creates an OSC 8 terminal hyperlink for terminals that support it.
 */
export function terminalLink(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

/**
 * Renders a visual skill bar e.g. [■■■■□]
 */
export function skillBar(level: number, max = 5): string {
  const clamped = Math.max(0, Math.min(level, max));
  const filled = "■".repeat(clamped);
  const empty = "□".repeat(max - clamped);
  return `${c.brightCyan}${filled}${c.gray}${empty}${c.reset}`;
}

/**
 * Renders a colored pill badge e.g. [ Rust ]
 */
export function badge(text: string, color: string = c.gray): string {
  return `${color}[${c.reset} ${c.brightWhite}${text}${c.reset} ${color}]${c.reset}`;
}

/**
 * Wraps text into lines not exceeding maxWidth.
 */
export function wrapText(text: string, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;
    if (!current) {
      current = word;
    } else if (stripAnsi(current).length + 1 + stripAnsi(word).length <= maxWidth) {
      current += " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

/**
 * Wraps an array of badges into lines not exceeding maxWidth,
 * keeping each badge token atomic so multi-word badges are never split across lines.
 */
export function wrapBadges(badges: string[], maxWidth: number): string[] {
  if (!badges || badges.length === 0) return [];
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentLen = 0;

  for (const item of badges) {
    const itemLen = stripAnsi(item).length;
    if (currentLine.length > 0 && currentLen + 1 + itemLen > maxWidth) {
      lines.push(currentLine.join(" "));
      currentLine = [item];
      currentLen = itemLen;
    } else {
      if (currentLine.length > 0) {
        currentLen += 1 + itemLen;
      } else {
        currentLen = itemLen;
      }
      currentLine.push(item);
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(" "));
  }

  return lines;
}

/**
 * Renders a section divider with an optional label.
 */
export function divider(label?: string, width = 74): string {
  if (!label) {
    return `${c.gray}${"─".repeat(width)}${c.reset}`;
  }
  const prefix = `── ${label} `;
  const remaining = Math.max(0, width - prefix.length);
  return `${c.gray}${prefix}${"─".repeat(remaining)}${c.reset}`;
}

export interface CardOptions {
  title?: string;
  rightBadge?: string;
  lines: string[];
  width?: number;
  borderColor?: string;
}

/**
 * Renders a rounded box card with clean borders:
 * ╭─ Title ───────────────────────────────── RightBadge ─╮
 * │  line 1                                              │
 * │  line 2                                              │
 * ╰──────────────────────────────────────────────────────╯
 * Guarantees that visible top, body, and bottom lines strictly equal width.
 */
export function renderCard({
  title,
  rightBadge,
  lines,
  width = 74,
  borderColor = c.gray,
}: CardOptions): string {
  const innerWidth = width - 4;
  const finalLines: string[] = [];

  // Enforce innerWidth on all card lines to prevent border breakout
  for (const line of lines) {
    const visibleLen = stripAnsi(line).length;
    if (visibleLen <= innerWidth) {
      finalLines.push(line);
    } else {
      const wrapped = wrapText(line, innerWidth);
      finalLines.push(...wrapped);
    }
  }

  let top = "";
  const titleClean = title ? stripAnsi(title) : "";
  const badgeClean = rightBadge ? stripAnsi(rightBadge) : "";

  // Check if title + badge both fit on the top line with at least 2 dashes separating them
  const canFitBoth = Boolean(
    titleClean &&
    badgeClean &&
    width - 8 - titleClean.length - badgeClean.length >= 2
  );

  if (canFitBoth) {
    const dashes = width - 8 - titleClean.length - badgeClean.length;
    top = `${borderColor}╭─${c.reset} ${title} ${borderColor}${"─".repeat(dashes)} ${rightBadge} ${borderColor}─╮${c.reset}`;
  } else if (titleClean) {
    // If right badge exists but didn't fit on the top line, insert it into the card body
    if (rightBadge) {
      if (finalLines.length > 0 && finalLines[0] === "") {
        finalLines.splice(1, 0, `  ${rightBadge}`);
      } else {
        finalLines.unshift(`  ${rightBadge}`);
      }
    }

    // Top format with title only: ╭─ title ─────╮
    const maxTitleLen = width - 7;
    const safeTitle = truncateVisible(title!, maxTitleLen);
    const safeTitleLen = stripAnsi(safeTitle).length;
    const dashes = width - 5 - safeTitleLen;
    top = `${borderColor}╭─${c.reset} ${safeTitle} ${borderColor}${"─".repeat(dashes)}╮${c.reset}`;
  } else if (badgeClean) {
    // Badge only, no title: ╭────── badge ─╮
    if (width - 6 - badgeClean.length >= 1) {
      const dashes = width - 6 - badgeClean.length;
      top = `${borderColor}╭─${"─".repeat(dashes)} ${rightBadge} ${borderColor}─╮${c.reset}`;
    } else {
      finalLines.unshift(`  ${rightBadge}`);
      top = `${borderColor}╭${"─".repeat(width - 2)}╮${c.reset}`;
    }
  } else {
    top = `${borderColor}╭${"─".repeat(width - 2)}╮${c.reset}`;
  }

  const body = finalLines.map((line) => {
    const visibleLen = stripAnsi(line).length;
    const pad = Math.max(0, innerWidth - visibleLen);
    return `${borderColor}│${c.reset} ${line}${" ".repeat(pad)} ${borderColor}│${c.reset}`;
  });

  const bottom = `${borderColor}╰${"─".repeat(width - 2)}╯${c.reset}`;
  return [top, ...body, bottom].join("\n");
}

/**
 * Wraps text into a clean box with Unicode borders.
 */
export function box(lines: string[], width = 74): string {
  const top = `${c.gray}┌${"─".repeat(width - 2)}┐${c.reset}`;
  const bottom = `${c.gray}└${"─".repeat(width - 2)}┘${c.reset}`;
  const content = lines
    .map((line) => {
      const visibleLength = stripAnsi(line).length;
      const padding = Math.max(0, width - 4 - visibleLength);
      return `${c.gray}│${c.reset}  ${line}${" ".repeat(padding)}${c.gray}│${c.reset}`;
    })
    .join("\n");
  return `${top}\n${content}\n${bottom}`;
}

/**
 * Renders a route header block.
 */
export function renderRouteHeader(route: string, subtitle?: string, width = 74): string {
  const line1 = `${c.gray}╭─${c.reset} ${c.brightGreen}~${c.reset} ${c.brightCyan}${route}${c.reset}`;
  const innerWidth = width - 4;
  const line2Content = subtitle ? `  ${c.dim}${subtitle}${c.reset}` : "";
  const pad2 = Math.max(0, innerWidth - stripAnsi(line2Content).length);
  const line2 = `${c.gray}│${c.reset} ${line2Content}${" ".repeat(pad2)} ${c.gray}│${c.reset}`;
  const bottom = `${c.gray}╰${"─".repeat(width - 2)}╯${c.reset}`;

  if (subtitle) {
    return `${line1}\n${line2}\n${bottom}`;
  }
  return `${line1}\n${bottom}`;
}
