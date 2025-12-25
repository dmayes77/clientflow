/**
 * Helper script to get your tenant ID
 * Run with: node scripts/get-tenant-id.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function getTenantId() {
  console.log("🔍 Looking up tenant information...\n");

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (tenants.length === 0) {
    console.log("❌ No tenants found in the database");
    return;
  }

  console.log(`✅ Found ${tenants.length} tenant(s):\n`);

  tenants.forEach((tenant, index) => {
    console.log(`${index + 1}. Name: ${tenant.name || "N/A"}`);
    console.log(`   Email: ${tenant.email}`);
    console.log(`   ID: ${tenant.id}`);
    console.log("");
  });

  if (tenants.length === 1) {
    console.log("💡 To seed tags for this tenant, run:");
    console.log(`   node scripts/seed-tags.js ${tenants[0].id}\n`);
  } else {
    console.log("💡 To seed tags, run:");
    console.log(`   node scripts/seed-tags.js <tenant-id>\n`);
  }
}

getTenantId()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
