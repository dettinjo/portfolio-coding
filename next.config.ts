import { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "active-confidence-ee4dbe67cf.media.strapiapp.com",
      },
    ],
  },
  output: "standalone",
  serverExternalPackages: ["libsql", "@payloadcms/db-sqlite"],
};

export default withPayload(withNextIntl(nextConfig));
