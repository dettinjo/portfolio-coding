import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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

export default withNextIntl(nextConfig);
