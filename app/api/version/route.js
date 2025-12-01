import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Cache the changelog parsing result
let cachedChangelog = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

function parseChangelog() {
  const now = Date.now();
  if (cachedChangelog && now - cacheTimestamp < CACHE_DURATION) {
    return cachedChangelog;
  }

  try {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    const content = fs.readFileSync(changelogPath, "utf8");

    // Parse the latest version section
    const versionRegex = /## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})\n\n([\s\S]*?)(?=\n## \[|$)/g;
    const versions = [];
    let match;

    while ((match = versionRegex.exec(content)) !== null) {
      const [, version, date, changes] = match;

      // Parse changes into categories
      const categories = {};
      const categoryRegex = /### (\w+[\w\s]*)\n([\s\S]*?)(?=\n### |$)/g;
      let categoryMatch;

      while ((categoryMatch = categoryRegex.exec(changes)) !== null) {
        const [, category, items] = categoryMatch;
        const itemsList = items
          .split("\n")
          .filter((line) => line.trim().startsWith("-"))
          .map((line) => line.trim().replace(/^- /, ""));

        if (itemsList.length > 0) {
          categories[category.trim()] = itemsList;
        }
      }

      versions.push({
        version,
        date,
        categories,
      });

      // Only get the last 3 versions for the API
      if (versions.length >= 3) break;
    }

    cachedChangelog = versions;
    cacheTimestamp = now;
    return versions;
  } catch {
    return [];
  }
}

export async function GET() {
  // Read version from package.json
  const packagePath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  const changelog = parseChangelog();

  return NextResponse.json({
    version: packageJson.version,
    name: packageJson.name,
    changelog,
    lastUpdated: changelog[0]?.date || null,
  });
}
