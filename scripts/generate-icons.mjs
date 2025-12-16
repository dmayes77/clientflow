#!/usr/bin/env node
/**
 * PWA Icon Generator
 * Generates all required PWA icons from a source SVG
 *
 * Usage: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");
const SPLASH_DIR = join(ROOT, "public", "splash");

// Icon sizes needed for PWA
const ICON_SIZES = [32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

// Shortcut icon size
const SHORTCUT_SIZE = 96;

// Splash screen sizes for iOS
const SPLASH_SCREENS = [
  { width: 2048, height: 2732, name: "apple-splash-2048-2732" }, // 12.9" iPad Pro
  { width: 1170, height: 2532, name: "apple-splash-1170-2532" }, // iPhone 12/13/14 Pro
  { width: 1179, height: 2556, name: "apple-splash-1179-2556" }, // iPhone 14 Pro
  { width: 1290, height: 2796, name: "apple-splash-1290-2796" }, // iPhone 14 Pro Max
];

// Source SVG for icons
const ICON_SVG = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#3b82f6"/>
  <text x="270" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="240" font-weight="700" font-style="italic" fill="white" text-anchor="middle">CF</text>
</svg>
`);

// Shortcut icons SVG templates
const SHORTCUT_SVGS = {
  booking: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#3b82f6"/>
      <path d="M28 36h40v4H28zm0 10h40v4H28zm0 10h24v4H28z" fill="white"/>
      <circle cx="64" cy="60" r="12" fill="#22c55e"/>
      <path d="M60 60l3 3 6-6" stroke="white" stroke-width="2" fill="none"/>
    </svg>
  `,
  invoice: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#3b82f6"/>
      <rect x="24" y="20" width="48" height="56" rx="4" fill="white"/>
      <path d="M32 32h32v2H32zm0 8h32v2H32zm0 8h20v2H32z" fill="#3b82f6"/>
      <text x="48" y="66" font-family="system-ui" font-size="16" font-weight="600" fill="#22c55e" text-anchor="middle">$</text>
    </svg>
  `,
  contacts: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#3b82f6"/>
      <circle cx="48" cy="36" r="14" fill="white"/>
      <path d="M24 72c0-13.255 10.745-24 24-24s24 10.745 24 24" fill="white"/>
    </svg>
  `,
  calendar: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="20" fill="#3b82f6"/>
      <rect x="20" y="28" width="56" height="48" rx="4" fill="white"/>
      <rect x="20" y="28" width="56" height="12" fill="#1d4ed8"/>
      <circle cx="32" cy="24" r="4" fill="white"/>
      <circle cx="64" cy="24" r="4" fill="white"/>
      <rect x="28" y="48" width="8" height="8" rx="1" fill="#3b82f6"/>
      <rect x="44" y="48" width="8" height="8" rx="1" fill="#3b82f6"/>
      <rect x="60" y="48" width="8" height="8" rx="1" fill="#3b82f6"/>
      <rect x="28" y="60" width="8" height="8" rx="1" fill="#3b82f6"/>
    </svg>
  `,
};

async function generateIcons() {
  console.log("Generating PWA icons...\n");

  // Ensure directories exist
  await mkdir(ICONS_DIR, { recursive: true });
  await mkdir(SPLASH_DIR, { recursive: true });

  // Generate main app icons
  for (const size of ICON_SIZES) {
    const filename = size === 180 ? "apple-touch-icon.png" : `icon-${size}x${size}.png`;
    await sharp(ICON_SVG)
      .resize(size, size)
      .png()
      .toFile(join(ICONS_DIR, filename));
    console.log(`  Created ${filename}`);
  }

  // Generate shortcut icons
  for (const [name, svg] of Object.entries(SHORTCUT_SVGS)) {
    await sharp(Buffer.from(svg))
      .resize(SHORTCUT_SIZE, SHORTCUT_SIZE)
      .png()
      .toFile(join(ICONS_DIR, `shortcut-${name}.png`));
    console.log(`  Created shortcut-${name}.png`);
  }

  // Generate splash screens
  console.log("\nGenerating splash screens...\n");
  for (const screen of SPLASH_SCREENS) {
    // Create splash with centered logo
    const logoSize = Math.min(screen.width, screen.height) * 0.25;
    const logo = await sharp(ICON_SVG)
      .resize(Math.round(logoSize), Math.round(logoSize))
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: screen.width,
        height: screen.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        {
          input: logo,
          gravity: "center",
        },
      ])
      .png()
      .toFile(join(SPLASH_DIR, `${screen.name}.png`));
    console.log(`  Created ${screen.name}.png`);
  }

  console.log("\nAll icons generated successfully!");
  console.log("\nNote: Replace public/icons/icon.svg with your actual logo for custom icons.");
}

generateIcons().catch(console.error);
