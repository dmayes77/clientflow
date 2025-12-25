/**
 * Seed script to populate suggested tags
 * Run with: node scripts/seed-tags.js
 */

import { PrismaClient } from "@prisma/client";
import { SUGGESTED_TAGS } from "../lib/data/suggested-tags.js";

const prisma = new PrismaClient();

async function seedTags() {
  console.log("🌱 Starting tag seeding...\n");

  // You need to replace this with your actual tenant ID
  const tenantId = process.argv[2];

  if (!tenantId) {
    console.error("❌ Error: Tenant ID required");
    console.log("Usage: node scripts/seed-tags.js <tenant-id>");
    console.log("\nTo get your tenant ID, run:");
    console.log("  npx prisma studio");
    console.log("  Then look at the Tenant table\n");
    process.exit(1);
  }

  // Verify tenant exists
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    console.error(`❌ Error: Tenant with ID "${tenantId}" not found`);
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}\n`);

  // Get all suggested tags
  const allTags = Object.values(SUGGESTED_TAGS).flat();

  let created = 0;
  let skipped = 0;

  for (const tagData of allTags) {
    try {
      // Check if tag already exists
      const existing = await prisma.tag.findUnique({
        where: {
          tenantId_name: {
            tenantId: tenantId,
            name: tagData.name,
          },
        },
      });

      if (existing) {
        console.log(`⏭️  Skipped: "${tagData.name}" (already exists)`);
        skipped++;
        continue;
      }

      // Create the tag
      await prisma.tag.create({
        data: {
          tenantId: tenantId,
          name: tagData.name,
          type: tagData.type,
          color: tagData.color,
          description: tagData.description,
        },
      });

      console.log(`✅ Created: "${tagData.name}" (${tagData.type}, ${tagData.color})`);
      created++;
    } catch (error) {
      console.error(`❌ Failed to create "${tagData.name}":`, error.message);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   Created: ${created} tags`);
  console.log(`   Skipped: ${skipped} tags (already existed)`);
  console.log(`   Total:   ${allTags.length} tags\n`);

  console.log("✨ Seeding complete!\n");
}

seedTags()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
