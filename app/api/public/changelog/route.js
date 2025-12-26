import { NextResponse } from "next/server";

// GET - Fetch public changelog from GitHub releases
export async function GET(request) {
  try {
    const githubRepo = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubRepo) {
      return NextResponse.json({
        error: "GitHub repo not configured"
      }, { status: 500 });
    }

    // Fetch releases from GitHub
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    const response = await fetch(
      `https://api.github.com/repos/${githubRepo}/releases?per_page=50`,
      {
        headers,
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.error("GitHub API error:", response.status, response.statusText);
      return NextResponse.json({
        error: "Failed to fetch releases",
        releases: [] // Return empty array as fallback
      }, { status: 200 });
    }

    const releases = await response.json();

    // Filter to only published releases (exclude drafts)
    const publishedReleases = releases.filter(r => !r.draft);

    // Transform to changelog format
    const changelog = publishedReleases.map(release => {
      // Determine type from release name/tags
      let type = "feature";
      const name = (release.name || release.tag_name).toLowerCase();

      if (name.includes("fix") || name.includes("patch") || name.includes("hotfix")) {
        type = "fix";
      } else if (name.includes("breaking")) {
        type = "breaking";
      } else if (name.includes("improve") || name.includes("update") || name.includes("enhance")) {
        type = "improvement";
      }

      // Parse release body to extract items
      const items = parseReleaseBody(release.body || "");

      return {
        version: release.tag_name.replace(/^v/, ""), // Remove leading 'v' if present
        date: new Date(release.published_at).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric"
        }),
        title: release.name || release.tag_name,
        isNew: publishedReleases.indexOf(release) === 0, // First release is newest
        items,
        htmlUrl: release.html_url,
      };
    });

    return NextResponse.json({
      changelog,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return NextResponse.json({
      error: error.message,
      changelog: [] // Return empty array as fallback
    }, { status: 200 });
  }
}

// Check if a changelog line is internal-only (should be filtered out)
function isInternalChange(text) {
  const lowerText = text.toLowerCase();

  // Filter out internal commit types
  const internalPrefixes = [
    'chore:',
    'chore(',
    'ci:',
    'ci(',
    'test:',
    'test(',
    'refactor:',
    'refactor(',
    'docs:',
    'docs(',
    'build:',
    'build(',
    'style:',
    'style(',
    'debug:',
    'debug(',
    'merge ',
  ];

  return internalPrefixes.some(prefix => lowerText.startsWith(prefix));
}

// Parse release body markdown to extract changelog items
function parseReleaseBody(body) {
  const items = [];

  // Split by lines
  const lines = body.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and headers
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Parse markdown list items (- or *)
    const listMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (listMatch) {
      const text = listMatch[1];

      // Filter out internal changes
      if (isInternalChange(text)) {
        continue;
      }

      // Determine type and extract title/description
      let type = "feature";
      let icon = "Sparkles";

      if (text.toLowerCase().includes("fix") || text.toLowerCase().includes("fixed")) {
        type = "fix";
        icon = "Bug";
      } else if (text.toLowerCase().includes("improv") || text.toLowerCase().includes("updat") || text.toLowerCase().includes("enhanc")) {
        type = "improvement";
        icon = "Zap";
      } else if (text.toLowerCase().startsWith("feat:") || text.toLowerCase().startsWith("feat(")) {
        type = "feature";
        icon = "Sparkles";
      } else if (text.toLowerCase().startsWith("perf:") || text.toLowerCase().startsWith("perf(")) {
        type = "improvement";
        icon = "Zap";
      }

      // Try to split title and description
      let title = text;
      let description = "";

      const colonIndex = text.indexOf(":");
      if (colonIndex > 0 && colonIndex < 100) {
        title = text.substring(0, colonIndex).trim();
        description = text.substring(colonIndex + 1).trim();
      }

      items.push({
        type,
        icon,
        title,
        description: description || title,
      });
    }
  }

  // If no items parsed (all were filtered), show fallback message
  if (items.length === 0 && body.trim()) {
    items.push({
      type: "improvement",
      icon: "Zap",
      title: "Internal improvements and bug fixes",
      description: "This release includes behind-the-scenes improvements to make ClientFlow better.",
    });
  }

  return items;
}
