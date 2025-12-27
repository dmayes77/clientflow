// PWA temporarily disabled - next-pwa is incompatible with Next.js 16+
// import withPWA from "next-pwa";

// Sentry temporarily disabled - investigating Next.js 16 compatibility issue
// See NEXT16_BUILD_ISSUE.md for details
// import { withSentryConfig } from "@sentry/nextjs";

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
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

// Sentry configuration - commented out temporarily
// const sentryWebpackPluginOptions = {
//   silent: true,
//   org: "code-maze",
//   project: "javascript-nextjs",
//   disableClientWebpackPlugin: process.env.NODE_ENV === 'development',
//   disableServerWebpackPlugin: process.env.NODE_ENV === 'development',
// };

// const sentryOptions = {
//   widenClientFileUpload: true,
//   tunnelRoute: "/monitoring",
//   hideSourceMaps: true,
//   disableLogger: true,
//   automaticVercelMonitors: true,
// };

// export default withSentryConfig(
//   nextConfig,
//   sentryWebpackPluginOptions,
//   sentryOptions
// );

export default nextConfig;
