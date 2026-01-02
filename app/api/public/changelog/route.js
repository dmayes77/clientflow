import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

// Icon mapping based on keywords in the content
const ICON_KEYWORDS = {
  workflow: "Workflow",
  drag: "Navigation",
  duplicate: "Boxes",
  copy: "Boxes",
  validation: "Shield",
  button: "Navigation",
  toggle: "Navigation",
  mobile: "Smartphone",
  scroll: "Navigation",
  email: "Mail",
  template: "Mail",
  action: "Zap",
  invoice: "Receipt",
  booking: "Calendar",
  payment: "CreditCard",
  contact: "Users",
  tag: "Activity",
  notification: "Bell",
  webhook: "Webhook",
  stat: "Activity",
  component: "Boxes",
};

// GET - Fetch changelog from CHANGELOG.md file
export async function GET() {
  try {
    // Read CHANGELOG.md from project root
    const changelogPath = join(process.cwd(), "CHANGELOG.md");
    let content;

    try {
      content = readFileSync(changelogPath, "utf-8");
    } catch {
      // Fallback to empty changelog if file doesn't exist
      return NextResponse.json({
        changelog: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    const changelog = parseChangelog(content);

    return NextResponse.json({
      changelog,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error reading changelog:", error);
    return NextResponse.json({
      error: error.message,
      changelog: [],
    }, { status: 200 });
  }
}

// Parse CHANGELOG.md content
function parseChangelog(content) {
  const releases = [];
  const lines = content.split("\n");

  let currentRelease = null;
  let currentSection = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Match version headers: ## v1.10.5 - January 2, 2026
    const versionMatch = trimmed.match(/^##\s+v?([\d.]+)\s*[-–]\s*(.+)/);
    if (versionMatch) {
      // Save previous release if exists
      if (currentRelease) {
        releases.push(currentRelease);
      }

      currentRelease = {
        version: versionMatch[1],
        date: versionMatch[2].trim(),
        title: `v${versionMatch[1]}`,
        isNew: releases.length === 0,
        items: [],
      };
      currentSection = null;
      continue;
    }

    // Match section headers: ### Workflow Improvements
    const sectionMatch = trimmed.match(/^###\s+(.+)/);
    if (sectionMatch && currentRelease) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Match list items: - **Feature Name** - Description
    const itemMatch = trimmed.match(/^[-*]\s+\*\*(.+?)\*\*\s*[-–]?\s*(.*)/);
    if (itemMatch && currentRelease) {
      const title = itemMatch[1].trim();
      const description = itemMatch[2].trim();

      // Determine type from section or content
      let type = "feature";
      if (currentSection?.toLowerCase().includes("fix")) {
        type = "fix";
      } else if (
        currentSection?.toLowerCase().includes("improve") ||
        currentSection?.toLowerCase().includes("enhance") ||
        currentSection?.toLowerCase().includes("ui")
      ) {
        type = "improvement";
      }

      // Determine icon from keywords
      const icon = getIconForContent(title + " " + description);

      currentRelease.items.push({
        type,
        icon,
        title,
        description: description || title,
      });
      continue;
    }

    // Match simple list items: - Item text
    const simpleItemMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (simpleItemMatch && currentRelease) {
      const text = simpleItemMatch[1].trim();

      // Determine type
      let type = "feature";
      if (text.toLowerCase().includes("fix")) {
        type = "fix";
      } else if (text.toLowerCase().includes("improve") || text.toLowerCase().includes("update")) {
        type = "improvement";
      }

      const icon = getIconForContent(text);

      currentRelease.items.push({
        type,
        icon,
        title: text,
        description: text,
      });
    }
  }

  // Add the last release
  if (currentRelease) {
    releases.push(currentRelease);
  }

  return releases;
}

// Get appropriate icon based on content keywords
function getIconForContent(text) {
  const lowerText = text.toLowerCase();

  for (const [keyword, icon] of Object.entries(ICON_KEYWORDS)) {
    if (lowerText.includes(keyword)) {
      return icon;
    }
  }

  return "Sparkles"; // Default icon
}
