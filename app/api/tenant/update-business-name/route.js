import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { businessName } = await request.json();

    if (!businessName || businessName.trim().length === 0) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    // Get tenant by Clerk organization ID
    const tenant = await prisma.tenant.findFirst({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    // Update Clerk organization name
    const client = await clerkClient();
    await client.organizations.updateOrganization(orgId, {
      name: businessName,
    });

    // Update tenant name in database
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: { name: businessName },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Error updating business name:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
