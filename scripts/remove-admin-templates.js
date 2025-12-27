#!/usr/bin/env node

/**
 * Remove admin-level system templates from tenant databases
 *
 * Removes payment_dispute and trial_ending templates which should not be
 * tenant templates (they are ClientFlow admin templates).
 *
 * Run with: node scripts/remove-admin-templates.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_TEMPLATE_KEYS = [
  "payment_dispute",
  "trial_ending",
];

async function removeAdminTemplates() {
  console.log("🗑️  Removing admin-level templates from tenant databases...\n");

  const result = await prisma.emailTemplate.deleteMany({
    where: {
      systemKey: {
        in: ADMIN_TEMPLATE_KEYS,
      },
    },
  });

  console.log(`✅ Removed ${result.count} template(s) with keys: ${ADMIN_TEMPLATE_KEYS.join(", ")}`);
  console.log("\nThese templates are now correctly identified as ClientFlow admin templates");
  console.log("and will NOT be seeded for new tenants.");
}

removeAdminTemplates()
  .catch((e) => {
    console.error("❌ Error removing admin templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
