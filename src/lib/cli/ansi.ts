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
