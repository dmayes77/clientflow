// PWA temporarily disabled - next-pwa is incompatible with Next.js 16+
// import withPWA from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  experimental: {
    // Force fresh client reference manifests on each build
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Suppress Sentry warnings when using Webpack (we're not using Turbopack)
  env: {
    SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING: '1',
  },
};

// Sentry webpack plugin options - updated for Next.js 16 compatibility
const sentryWebpackPluginOptions = {
  silent: true,
  org: "code-maze",
  project: "javascript-nextjs",
  // Disable for development to avoid build issues
  disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
  disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
};

const sentryOptions = {
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions,
  sentryOptions
);
