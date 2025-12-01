import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  // Allow larger file uploads (up to 100MB for videos)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  turbopack: {
    resolveAlias: {
      '@': __dirname,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
    };
    return config;
  },
};

export default nextConfig;
