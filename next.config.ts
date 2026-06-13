import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// STATIC_EXPORT=1 produces a fully static site (for the GitHub Pages demo): no
// server, images unoptimized, optional basePath for a project page. The normal
// server build (Docker/Coolify) is unaffected.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.PAGES_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    ...(staticExport ? { unoptimized: true } : {}),
  },
  output: staticExport ? "export" : "standalone",
  // Directory-style URLs (en/index.html) avoid GitHub Pages' file-vs-folder
  // ambiguity for the static export.
  ...(staticExport ? { trailingSlash: true } : {}),
  ...(staticExport && basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default withNextIntl(nextConfig);
