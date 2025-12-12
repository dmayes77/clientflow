/**
 * Script to create system tags for all existing tenants
 * Run with: node scripts/create-system-tags.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ALL_SYSTEM_TAGS = [
  // Invoice status tags
  { name: "Draft", color: "gray", description: "Invoice has been created but not yet sent", type: "invoice" },
  { name: "Sent", color: "blue", description: "Invoice has been sent to the client", type: "invoice" },
  { name: "Viewed", color: "indigo", description: "Client has viewed the invoice", type: "invoice" },
  { name: "Paid", color: "green", description: "Invoice has been paid", type: "invoice" },
  { name: "Overdue", color: "red", description: "Invoice is past due date", type: "invoice" },
  { name: "Cancelled", color: "gray", description: "Invoice has been cancelled", type: "invoice" },
  // Booking status tags
  { name: "Inquiry", color: "yellow", description: "Initial inquiry from client", type: "booking" },
  { name: "Confirmed", color: "green", description: "Booking has been confirmed", type: "booking" },
  { name: "Completed", color: "blue", description: "Booking has been completed", type: "booking" },
  { name: "Cancelled", color: "red", description: "Booking has been cancelled", type: "booking" },
  { name: "No Show", color: "gray", description: "Client did not show up", type: "booking" },
  // Contact status tags
  { name: "Lead", color: "yellow", description: "New potential client", type: "contact" },
  { name: "Client", color: "green", description: "Active client", type: "contact" },
  { name: "Inactive", color: "gray", description: "Inactive contact", type: "contact" },
];

async function createSystemTagsForTenant(tenantId) {
  const createPromises = ALL_SYSTEM_TAGS.map((tag) =>
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

  return Promise.all(createPromises);
}

async function main() {
  console.log("Starting system tags migration...");

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${tenants.length} tenants`);

  for (const tenant of tenants) {
    console.log(`Creating system tags for tenant: ${tenant.name} (${tenant.id})`);
    try {
      await createSystemTagsForTenant(tenant.id);
      console.log(`  ✓ Created system tags`);
    } catch (error) {
      console.error(`  ✗ Error creating tags:`, error.message);
    }
  }

  console.log("Migration complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
