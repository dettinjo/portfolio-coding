import { NextConfig } from "next";
import { withPayload } from '@payloadcms/next/withPayload'
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // --- THIS IS THE FIX ---
      // We are adding a new rule to allow images from your local Strapi instance.
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**", // Be specific to the uploads folder
      },
      {
        protocol: "https",
        hostname: "active-confidence-ee4dbe67cf.media.strapiapp.com",
      },
    ],
  },
};

export default withPayload(withNextIntl(nextConfig));
