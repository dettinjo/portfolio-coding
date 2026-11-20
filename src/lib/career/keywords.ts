const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Case-insensitive whole-word match, so the keyword "R" does not hit every word
 * containing an r, while "CI/CD" or "Next.js" still match literally.
 */
export function hasKeyword(text: string, keyword: string): boolean {
  const k = escape(keyword.toLowerCase().trim());
  if (!k) return false;
  return new RegExp(`(^|[^a-z0-9])${k}([^a-z0-9]|$)`).test(text.toLowerCase());
}
