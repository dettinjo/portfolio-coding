import { c, renderCard } from "./cli/ansi";

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

const LIMITS: Record<"cli" | "contact" | "general", RateLimitConfig> = {
  // 60 requests per minute for terminal CLI queries
  cli: { limit: 60, windowMs: 60 * 1000 },
  // 5 submissions per 15 minutes for contact form to prevent SMTP spam
  contact: { limit: 5, windowMs: 15 * 60 * 1000 },
  // 120 requests per minute for general web browsing
  general: { limit: 120, windowMs: 60 * 1000 },
};

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory sliding window store
const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  // Run cleanup at most once per 30 seconds
  if (now - lastCleanup < 30000) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Extracts client IP from standard proxy headers (x-forwarded-for, x-real-ip, cf-connecting-ip).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "127.0.0.1";
}

/**
 * Checks and increments rate limit counter for a given IP and category.
 */
export function checkRateLimit(
  ip: string,
  category: "cli" | "contact" | "general" = "general"
): RateLimitResult {
  cleanupExpired();

  const config = LIMITS[category] || LIMITS.general;
  const key = `${category}:${ip}`;
  const now = Date.now();

  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // New window
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  // Existing window
  entry.count += 1;
  const remaining = Math.max(0, config.limit - entry.count);
  const resetInSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

  if (entry.count > config.limit) {
    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetInSeconds,
    };
  }

  return {
    allowed: true,
    limit: config.limit,
    remaining,
    resetInSeconds,
  };
}

/**
 * Renders a terminal-conforming 429 Too Many Requests response box.
 */
export function renderRateLimitCliResponse(result: RateLimitResult): string {
  const lines = [
    "",
    `  ${c.brightRed}Error:${c.reset} Rate limit exceeded: Too many requests from this IP.`,
    `  Please wait a moment before trying again.`,
    "",
    `  ${c.gray}Retry-After:${c.reset}  ${c.brightYellow}${result.resetInSeconds} seconds${c.reset}`,
    `  ${c.gray}Limit:${c.reset}        ${c.dim}${result.limit} requests / minute${c.reset}`,
    "",
  ];

  const card = renderCard({
    title: `${c.bold}${c.brightRed}429: TOO MANY REQUESTS${c.reset}`,
    rightBadge: `${c.dim}[Rate Limit]${c.reset}`,
    lines,
    width: 74,
    borderColor: c.brightRed,
  });

  return `\n${card}\n`;
}
