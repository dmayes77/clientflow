/**
 * Find and optionally delete tenants whose Clerk organizations no longer exist
 * Usage:
 *   npm run cleanup-tenants -- --dry-run  (preview only)
 *   npm run cleanup-tenants -- --delete   (actually delete)
 */

const { PrismaClient } = require("@prisma/client");
const { clerkClient } = require("@clerk/nextjs/server");

const prisma = new PrismaClient();

async function cleanupOrphanedTenants() {
  const isDryRun = !process.argv.includes("--delete");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  DELETE MODE - Orphaned tenants will be removed\n");
  }

  try {
    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        businessName: true,
        email: true,
        clerkOrgId: true,
        subscriptionStatus: true,
        createdAt: true,
      },
    });

    console.log(`📊 Found ${tenants.length} total tenants in database\n`);

    const client = await clerkClient();

    // Get all Clerk organizations
    const { data: clerkOrgs } = await client.organizations.getOrganizationList({
      limit: 100,
    });

    const clerkOrgIds = new Set(clerkOrgs.map(org => org.id));
    console.log(`📊 Found ${clerkOrgIds.size} organizations in Clerk\n`);

    // Find orphaned tenants
    const orphanedTenants = tenants.filter(tenant => {
      return tenant.clerkOrgId && !clerkOrgIds.has(tenant.clerkOrgId);
    });

    if (orphanedTenants.length === 0) {
      console.log("✅ No orphaned tenants found! Database is clean.");
      return;
    }

    console.log(`⚠️  Found ${orphanedTenants.length} orphaned tenant(s):\n`);

    orphanedTenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.businessName || tenant.name}`);
      console.log(`   Email: ${tenant.email}`);
      console.log(`   Clerk Org ID: ${tenant.clerkOrgId}`);
      console.log(`   Subscription: ${tenant.subscriptionStatus || "none"}`);
      console.log(`   Created: ${tenant.createdAt.toLocaleDateString()}`);
      console.log("");
    });

    if (isDryRun) {
      console.log("💡 Run with --delete flag to remove these tenants:");
      console.log("   node scripts/cleanup-orphaned-tenants.js --delete\n");
    } else {
      console.log("🗑️  Deleting orphaned tenants...\n");

      for (const tenant of orphanedTenants) {
        try {
          // Delete tenant (cascade will handle related records)
          await prisma.tenant.delete({
            where: { id: tenant.id },
          });
          console.log(`✅ Deleted: ${tenant.businessName || tenant.name} (${tenant.email})`);
        } catch (error) {
          console.error(`❌ Failed to delete ${tenant.businessName || tenant.name}: ${error.message}`);
        }
      }

      console.log(`\n✅ Cleanup complete! Removed ${orphanedTenants.length} orphaned tenant(s).`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.errors) {
      console.error("Details:", error.errors);
    }
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedTenants();
