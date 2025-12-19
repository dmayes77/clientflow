import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Helper to sync slug from Clerk org to tenant
async function syncSlugFromClerk(tenant, orgId) {
  if (tenant.slug && tenant.businessName) return tenant; // Already has slug and businessName

  try {
    const client = await clerkClient();
    const org = await client.organizations.getOrganization({ organizationId: orgId });

    const updateData = {};
    if (!tenant.slug && org.slug) {
      updateData.slug = org.slug;
    }
    if (!tenant.businessName && org.name) {
      updateData.businessName = org.name;
    }

    if (Object.keys(updateData).length > 0) {
      return await prisma.tenant.update({
        where: { id: tenant.id },
        data: updateData,
      });
    }
  } catch (error) {
    console.error("Error syncing slug from Clerk:", error);
  }
  return tenant;
}

// GET /api/onboarding/progress - Get current onboarding step
export async function GET() {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        setupComplete: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Sync slug from Clerk if missing
    tenant = await syncSlugFromClerk(tenant, orgId);

    return NextResponse.json({
      step: tenant.onboardingStep,
      completedAt: tenant.onboardingCompletedAt,
      isComplete: tenant.onboardingCompletedAt !== null || tenant.setupComplete,
      slug: tenant.slug,
    });
  } catch (error) {
    console.error("Error getting onboarding progress:", error);
    return NextResponse.json({ error: "Failed to get progress" }, { status: 500 });
  }
}

// PATCH /api/onboarding/progress - Update onboarding step
export async function PATCH(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { step, complete } = await request.json();

    const updateData = {};

    if (typeof step === 'number') {
      updateData.onboardingStep = step;
    }

    if (complete) {
      updateData.onboardingCompletedAt = new Date();
      updateData.setupComplete = true;
    }

    let tenant = await prisma.tenant.update({
      where: { clerkOrgId: orgId },
      data: updateData,
      select: {
        id: true,
        slug: true,
        businessName: true,
        onboardingStep: true,
        onboardingCompletedAt: true,
        setupComplete: true,
      },
    });

    // Sync slug from Clerk if missing
    tenant = await syncSlugFromClerk(tenant, orgId);

    return NextResponse.json({
      step: tenant.onboardingStep,
      completedAt: tenant.onboardingCompletedAt,
      isComplete: tenant.onboardingCompletedAt !== null || tenant.setupComplete,
      slug: tenant.slug,
    });
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
