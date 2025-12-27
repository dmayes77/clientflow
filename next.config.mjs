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

// Sentry webpack plugin options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: "code-maze",
  project: "javascript-nextjs",
};

const sentryOptions = {
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  widenClientFileUpload: true,
  transpileClientSDK: true,
  hideSourceMaps: true,
  disableLogger: true,
};

// Temporarily disable Sentry to debug build issue
export default nextConfig;

// export default withSentryConfig(
//   nextConfig,
//   sentryWebpackPluginOptions,
//   sentryOptions
// );
