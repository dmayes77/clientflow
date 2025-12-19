import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/signup/check-slug - Check if slug is available
export async function POST(request) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Validate slug format (lowercase letters, numbers, hyphens)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({
        available: false,
        error: "Slug can only contain lowercase letters, numbers, and hyphens"
      }, { status: 400 });
    }

    // Minimum length
    if (slug.length < 3) {
      return NextResponse.json({
        available: false,
        error: "Slug must be at least 3 characters"
      }, { status: 400 });
    }

    // Maximum length
    if (slug.length > 50) {
      return NextResponse.json({
        available: false,
        error: "Slug must be 50 characters or less"
      }, { status: 400 });
    }

    // Check if slug exists in database
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    const isAvailable = !existingTenant;

    // Generate suggestions if slug is taken
    let suggestions = [];
    if (!isAvailable) {
      const baseSlug = slug.replace(/-\d+$/, ''); // Remove trailing numbers
      suggestions = await generateSuggestions(baseSlug);
    }

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable ? "Slug is available" : "Slug is already taken",
      suggestions: isAvailable ? [] : suggestions,
    });
  } catch (error) {
    console.error("Error checking slug:", error);
    return NextResponse.json({
      error: "Failed to check slug availability"
    }, { status: 500 });
  }
}

// Generate alternative slug suggestions
async function generateSuggestions(baseSlug) {
  const suggestions = [];
  const suffixes = ['1', '2', '3', 'pro', 'app', 'hq'];

  for (const suffix of suffixes) {
    const suggestion = `${baseSlug}-${suffix}`;
    const exists = await prisma.tenant.findUnique({
      where: { slug: suggestion },
      select: { id: true },
    });

    if (!exists) {
      suggestions.push(suggestion);
    }

    if (suggestions.length >= 3) break;
  }

  return suggestions;
}
