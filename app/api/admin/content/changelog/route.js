import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET - Fetch releases from GitHub
export async function GET(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const githubRepo = process.env.GITHUB_REPO;
    const githubToken = process.env.GITHUB_TOKEN;

    if (!githubRepo) {
      return NextResponse.json({
        error: "GitHub repo not configured. Set GITHUB_REPO in environment variables."
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
      { headers, next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("GitHub API error:", error);
      return NextResponse.json({
        error: `Failed to fetch releases: ${error.message || response.statusText}`
      }, { status: response.status });
    }

    const releases = await response.json();

    // Transform GitHub releases to match our changelog format
    const entries = releases.map(release => {
      // Determine type from release tags or name
      let type = "feature";
      const name = release.name || release.tag_name;
      const lowerName = name.toLowerCase();

      if (lowerName.includes("fix") || lowerName.includes("patch") || lowerName.includes("hotfix")) {
        type = "fix";
      } else if (lowerName.includes("breaking")) {
        type = "breaking";
      } else if (lowerName.includes("improve") || lowerName.includes("update") || lowerName.includes("enhance")) {
        type = "improvement";
      }

      return {
        id: release.id.toString(),
        version: release.tag_name,
        title: release.name || release.tag_name,
        content: release.body || "",
        type,
        published: !release.draft,
        publishedAt: release.published_at,
        createdAt: release.created_at,
        htmlUrl: release.html_url,
        author: release.author?.login || "Unknown",
      };
    });

    // Calculate counts
    const publishedCount = entries.filter(e => e.published).length;
    const draftCount = entries.filter(e => !e.published).length;

    return NextResponse.json({
      entries,
      counts: {
        total: entries.length,
        published: publishedCount,
        draft: draftCount,
      },
    });
  } catch (error) {
    console.error("Error fetching GitHub releases:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
