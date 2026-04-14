import { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  output: "standalone",
  serverExternalPackages: ["libsql", "@payloadcms/db-sqlite"],
};

export default withPayload(withNextIntl(nextConfig));
