// Prefix root-absolute asset paths with the configured base path so they resolve
// under a static-export sub-path (e.g. a GitHub Pages project page served from
// /<repo>/). A no-op for the normal build, where NEXT_PUBLIC_BASE_PATH is unset.
//
// Needed because next/image with `unoptimized` and plain <img> emit the given
// `src` verbatim — Next does not prepend basePath to a runtime string src.

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function withBasePath<T extends string | null | undefined>(path: T): T {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return path;
  return `${BASE_PATH}${path}` as T;
}
