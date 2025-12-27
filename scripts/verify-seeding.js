#!/usr/bin/env node

/**
 * Verify database seeding
 * Shows counts of system templates and tags
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying Database Seeding\n");
  console.log("=".repeat(60));

  // Get tenant info
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      businessName: true,
    },
  });

  for (const tenant of tenants) {
    const displayName = tenant.businessName || tenant.name || tenant.id;
    console.log(`\n📊 Tenant: ${displayName}`);
    console.log("-".repeat(60));

    // Count system templates
    const systemTemplates = await prisma.emailTemplate.count({
      where: {
        tenantId: tenant.id,
        isSystem: true,
      },
    });

    const allTemplates = await prisma.emailTemplate.count({
      where: { tenantId: tenant.id },
    });

    console.log(`\n📧 Email Templates:`);
    console.log(`   System Templates: ${systemTemplates}`);
    console.log(`   Total Templates:  ${allTemplates}`);

    // List system templates
    if (systemTemplates > 0) {
      const templates = await prisma.emailTemplate.findMany({
        where: {
          tenantId: tenant.id,
          isSystem: true,
        },
        select: {
          systemKey: true,
          name: true,
          category: true,
        },
        orderBy: { systemKey: "asc" },
      });

      console.log(`\n   📋 System Templates:`);
      templates.forEach((t) => {
        console.log(`      • ${t.systemKey.padEnd(25)} - ${t.name}`);
      });
    }

    // Count tags
    const systemTags = await prisma.tag.count({
      where: {
        tenantId: tenant.id,
        isSystem: true,
      },
    });

    const defaultTags = await prisma.tag.count({
      where: {
        tenantId: tenant.id,
        isSystem: false,
      },
    });

    const allTags = await prisma.tag.count({
      where: { tenantId: tenant.id },
    });

    console.log(`\n\n🏷️  Tags:`);
    console.log(`   System Tags:  ${systemTags} (status tags, cannot be deleted)`);
    console.log(`   Default Tags: ${defaultTags} (organizational tags)`);
    console.log(`   Total Tags:   ${allTags}`);

    // List system tags by type
    if (systemTags > 0) {
      const tags = await prisma.tag.findMany({
        where: {
          tenantId: tenant.id,
          isSystem: true,
        },
        select: {
          name: true,
          type: true,
          color: true,
        },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      });

      console.log(`\n   📋 System Tags by Type:`);

      const tagsByType = tags.reduce((acc, tag) => {
        if (!acc[tag.type]) acc[tag.type] = [];
        acc[tag.type].push(tag);
        return acc;
      }, {});

      for (const [type, typeTags] of Object.entries(tagsByType)) {
        console.log(`\n      ${type.toUpperCase()} (${typeTags.length}):`);
        typeTags.forEach((t) => {
          console.log(`         • ${t.name.padEnd(15)} (${t.color})`);
        });
      }
    }

    console.log("\n" + "=".repeat(60));
  }

  // Summary
  console.log(`\n✅ Verification Complete!`);
  console.log(`\n   Summary:`);
  console.log(`   - ${tenants.length} tenant(s) found`);

  const totalSystemTemplates = await prisma.emailTemplate.count({
    where: { isSystem: true },
  });
  const totalSystemTags = await prisma.tag.count({
    where: { isSystem: true },
  });
  const totalDefaultTags = await prisma.tag.count({
    where: { isSystem: false },
  });

  console.log(`   - ${totalSystemTemplates} system email template(s) total`);
  console.log(`   - ${totalSystemTags} system tag(s) total`);
  console.log(`   - ${totalDefaultTags} default tag(s) total`);
  console.log("");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
