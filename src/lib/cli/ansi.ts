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
 */
export function renderCard({
  title,
  rightBadge,
  lines,
  width = 74,
  borderColor = c.gray,
}: CardOptions): string {
  let top = `${borderColor}╭─${c.reset}`;
  let usedWidth = 2; // "╭─"

  if (title) {
    const titleVisible = stripAnsi(title);
    top += ` ${title} ${borderColor}`;
    usedWidth += titleVisible.length + 2;
  }

  const finalLines = [...lines];

  if (rightBadge) {
    const badgeVisible = stripAnsi(rightBadge);
    const available = width - usedWidth - badgeVisible.length - 4; // " ...  [badge] ─╮"
    if (available >= 2) {
      top += `${"─".repeat(available)} ${rightBadge} ${borderColor}─╮${c.reset}`;
    } else {
      // Not enough space on top border for right badge, put plain top and insert badge into body
      const remainingDashes = Math.max(1, width - usedWidth - 1);
      top += `${"─".repeat(remainingDashes)}╮${c.reset}`;
      finalLines.unshift(`  ${rightBadge}`);
    }
  } else {
    const dashes = Math.max(1, width - usedWidth - 1);
    top += `${"─".repeat(dashes)}╮${c.reset}`;
  }

  const innerWidth = width - 4;
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
