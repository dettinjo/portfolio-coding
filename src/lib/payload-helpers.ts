// Client-safe helper functions for Payload CMS
// These don't import any Payload modules and can be used in client components

import type { StrapiImage } from "./payload-types-shared";

/**
 * Generate media URL from Payload image object
 * This is a client-safe version that just constructs URLs
 */
export function getMediaUrl(
  image: StrapiImage | string | null | undefined
): string | null {
  if (!image) return null;

  // If it's a string, assume it's already a URL or path
  if (typeof image === "string") {
    // If it starts with http, return as-is
    if (image.startsWith("http")) return image;
    // If it already starts with /api/media, return as-is
    if (image.startsWith("/api/media")) return image;
    // Otherwise, prepend the media path
    return `/api/media${image.startsWith("/") ? "" : "/"}${image}`;
  }

  // If it's an object with a url property
  if (image.url) {
    if (image.url.startsWith("http")) return image.url;
    // Payload usually returns the full path including prefix if configured, or relative path
    // If it's just a filename or relative path, we might need to prepend /media if that's the staticURL
    // But usually Payload's 'url' field is ready to use (e.g. /media/file.png)
    return image.url;
  }

  return null;
}
