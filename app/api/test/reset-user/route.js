import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();

    // Find and delete Clerk user
    const users = await client.users.getUserList({
      emailAddress: [email],
    });

    const deletedUsers = [];
    const deletedOrgs = [];
    const deletedTenants = [];

    // Also delete tenant by email (in case Clerk user was already deleted)
    const tenantByEmail = await prisma.tenant.findFirst({
      where: { email },
    });
    if (tenantByEmail) {
      await prisma.tenant.delete({
        where: { id: tenantByEmail.id },
      });
      deletedTenants.push(tenantByEmail.id);
    }

    for (const user of users.data) {
      // Get user's organizations
      const orgs = await client.users.getOrganizationMembershipList({
        userId: user.id,
      });

      // Delete organizations
      for (const membership of orgs.data) {
        try {
          await client.organizations.deleteOrganization({
            organizationId: membership.organization.id,
          });
          deletedOrgs.push(membership.organization.id);

          // Delete tenant from database
          const tenant = await prisma.tenant.findFirst({
            where: { clerkOrgId: membership.organization.id },
          });
          if (tenant) {
            await prisma.tenant.delete({
              where: { id: tenant.id },
            });
            deletedTenants.push(tenant.id);
          }
        } catch (error) {
          console.log(`Could not delete org ${membership.organization.id}:`, error.message);
        }
      }

      // Delete user
      await client.users.deleteUser(user.id);
      deletedUsers.push(user.id);
    }

    return NextResponse.json({
      success: true,
      message: "User and related data deleted",
      deletedUsers,
      deletedOrgs,
      deletedTenants,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
