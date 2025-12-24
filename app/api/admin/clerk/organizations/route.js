import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET - Fetch all Clerk organizations and diagnostics
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const client = await clerkClient();

    // Fetch all organizations
    const { data: organizations, totalCount } = await client.organizations.getOrganizationList({
      limit: 100,
      offset: 0,
    });

    // Calculate usage
    const limit = 100; // Free plan limit
    const remaining = Math.max(0, limit - totalCount);
    const percentUsed = ((totalCount / limit) * 100).toFixed(1);

    return NextResponse.json({
      totalCount,
      limit,
      remaining,
      percentUsed: parseFloat(percentUsed),
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        createdAt: org.createdAt,
        membersCount: org.membersCount || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching Clerk organizations:", error);
    return NextResponse.json({
      error: error.message,
      details: error.errors || null,
    }, { status: 500 });
  }
}
