/**
 * Script to create system and default tags for all existing tenants
 * Run with: node scripts/create-system-tags.mjs
 *
 * This will create:
 * - 14 system tags (status tags, cannot be deleted)
 * - 31 default tags (organizational tags, can be deleted)
 */

import { PrismaClient } from "@prisma/client";
import { ALL_SYSTEM_TAGS, DEFAULT_TAGS } from "../lib/system-tags.js";

const prisma = new PrismaClient();

async function createTagsForTenant(tenantId) {
  // Create system tags (cannot be deleted)
  const systemTagPromises = ALL_SYSTEM_TAGS.map((tag) =>
    prisma.tag.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: tag.name,
        },
      },
      update: {
        isSystem: true,
        color: tag.color,
        description: tag.description,
        type: tag.type,
      },
      create: {
        tenantId,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        type: tag.type,
        isSystem: true,
      },
    })
  );

  // Create default tags (can be deleted by users)
  const defaultTagPromises = DEFAULT_TAGS.map((tag) =>
    prisma.tag.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: tag.name,
        },
      },
      update: {
        isSystem: false,
        color: tag.color,
        description: tag.description,
        type: tag.type,
      },
      create: {
        tenantId,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        type: tag.type,
        isSystem: false,
      },
    })
  );

  return Promise.all([...systemTagPromises, ...defaultTagPromises]);
}

async function main() {
  console.log("Starting tags migration...");
  console.log(`Creating 14 system tags + 31 default tags = 45 total tags per tenant\n`);

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${tenants.length} tenant(s)\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const tenant of tenants) {
    console.log(`Processing tenant: ${tenant.name || tenant.id}`);
    try {
      await createTagsForTenant(tenant.id);
      console.log(`  ✓ Created/updated tags for ${tenant.name || tenant.id}`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Error creating tags:`, error.message);
      errorCount++;
    }
  }

  console.log(`\nMigration complete!`);
  console.log(`  Success: ${successCount} tenant(s)`);
  console.log(`  Errors: ${errorCount} tenant(s)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
