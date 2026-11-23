// Pure README helpers shared by the build-time pipeline (scripts/fetch-portfolio.ts)
// and the runtime GitHub sync behind the MCP `sync_github_projects` tool.
// No Node/Next imports here so both environments can use it.

/**
 * Optional development-date override embedded in a README as an HTML comment:
 * "<!-- portfolio:date=2022-07-01 -->". Lets a repo created later than the
 * project was actually built report the real date.
 */
export function parseDateOverride(markdown: string): string | null {
  const m = markdown.match(/<!--\s*portfolio:date=([0-9]{4}-[0-9]{2}-[0-9]{2})\s*-->/i);
  return m ? m[1] : null;
}

/** Flattens inline markdown (links, code, bold/italic) to plain prose. */
export function flattenMarkdown(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // inline HTML
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/__([^_]+)__/g, "$1") // bold (underscore)
    .replace(/\*([^*]+)\*/g, "$1") // italic
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts text to `max` chars on a word boundary, appending an ellipsis. */
export function truncateWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : max - 1).replace(/[\s,;:—–-]+$/, "") + "…";
}

const SWITCHER_LINK_RE = /\[[^\]]*\]\(README(\.[a-z]{2})?\.md\)/gi;

/**
 * True when a line is purely a Markdown or HTML README language switcher, e.g.
 * `**[English](README.md) · [Deutsch](README.de.md)**`.
 */
export function isLanguageSwitcherLine(line: string): boolean {
  const s = line.trim();
  if (!s) return false;
  if (/<a[^>]+href=["']README(\.[a-z]{2})?\.md["']/i.test(s)) {
    const restHtml = s
      .replace(/<a\b[^>]*href=["']README(\.[a-z]{2})?\.md["'][^>]*>[\s\S]*?<\/a>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[\s*_·|/\\•—–-]+/g, "")
      .replace(/[\uFE00-\uFE0F\u200D]/g, "")
      .replace(/\p{Extended_Pictographic}/gu, "");
    return restHtml === "";
  }
  if (!SWITCHER_LINK_RE.test(s)) return false;
  SWITCHER_LINK_RE.lastIndex = 0;
  const rest = s
    .replace(SWITCHER_LINK_RE, "")
    .replace(/[\s*_·|/\\•—–-]+/g, "")
    .replace(/[\uFE00-\uFE0F\u200D]/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "");
  return rest === "";
}

/**
 * Extracts the first prose paragraph from a README body (title, language
 * switcher and portfolio:date comment already stripped) for use as a card
 * preview / meta description. Skips headings, HTML blocks, blockquotes, badge
 * chains and image-only lines.
 */
export function extractFirstParagraph(body: string, maxLen = 260): string {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const isBadgeLine = (s: string): boolean => /^(\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\s*)+$/.test(s);
  const isImageOnlyLine = (s: string): boolean => /^(!\[[^\]]*\]\([^)]*\)\s*)+$/.test(s);

  const paraLines: string[] = [];
  let collecting = false;
  for (const raw of lines) {
    const s = raw.trim();
    if (!collecting) {
      if (s === "") continue;
      if (s.startsWith("#") || s.startsWith("<") || s.startsWith(">")) continue;
      if (isLanguageSwitcherLine(s) || isBadgeLine(s) || isImageOnlyLine(s)) continue;
      collecting = true;
      paraLines.push(s);
    } else {
      if (s === "" || s.startsWith("#") || s.startsWith("<") || s.startsWith(">")) break;
      paraLines.push(s);
    }
  }

  return truncateWords(flattenMarkdown(paraLines.join(" ")), maxLen);
}

/**
 * Concise 1–2 sentence summary from a longer description: keeps whole
 * sentences up to `maxLen` chars, falling back to a word-boundary cut.
 */
/** Splits prose into sentences without breaking on "Next.js", "e.g." or "v2.1". */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function summarize(text: string, maxLen = 240): string {
  const clean = flattenMarkdown(text);
  let out = "";
  for (const s of splitSentences(clean).slice(0, 2)) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > maxLen) break;
    out = next;
  }
  return out || truncateWords(clean, maxLen);
}

/**
 * Up to `max` concrete technical bullets from a README: list items (bulleted
 * or numbered, continuation lines joined), excluding navigation/link-only
 * items. A bold lead ("**Sync** — text") is kept as "Sync: text".
 */
export function extractHighlights(body: string, max = 2, maxLen = 200): string[] {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const items: string[] = [];
  let current: string | null = null;
  let inCode = false;

  const flush = () => {
    if (current !== null) items.push(current);
    current = null;
  };

  for (const raw of lines) {
    if (/^\s*```/.test(raw)) {
      inCode = !inCode;
      flush();
      continue;
    }
    if (inCode) continue;
    const m = raw.match(/^\s{0,3}(?:[-*+]|\d+\.)\s+(.*)$/);
    if (m) {
      flush();
      current = m[1];
    } else if (current !== null && /^\s{2,}\S/.test(raw)) {
      current += " " + raw.trim(); // continuation line
    } else {
      flush();
    }
  }
  flush();

  const out: string[] = [];
  for (const item of items) {
    // "**Lead** — rest" / "**Lead**: rest" → "Lead: rest"
    const lead = item.match(/^\*\*([^*]+)\*\*\s*[:—–-]?\s*(.*)$/);
    let text = lead ? `${lead[1].replace(/[:.]$/, "")}: ${lead[2]}` : item;
    text = flattenMarkdown(text);
    if (text.length < 40) continue; // nav links, one-word bullets
    if (/^(english|deutsch|español)\b/i.test(text)) continue;
    // Prefer the first full sentence when it fits.
    const first = splitSentences(text)[0] ?? text;
    out.push(first.length >= 40 && first.length <= maxLen ? first : truncateWords(text, maxLen));
    if (out.length >= max) break;
  }
  return out;
}
