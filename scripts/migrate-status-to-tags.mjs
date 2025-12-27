/**
 * Migration Script: Status Fields → Tags
 *
 * Since ClientFlow hasn't been released yet, this script ensures all existing
 * entities have their status represented as tags (the new source of truth).
 *
 * Run with: node scripts/migrate-status-to-tags.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Status field to tag name mappings
const STATUS_MAPS = {
  invoice: {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
  },
  booking: {
    inquiry: "Inquiry",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    "no show": "No Show",
    noshow: "No Show",
  },
  contact: {
    lead: "Lead",
    client: "Client",
    active: "Client",
    inactive: "Inactive",
  },
};

async function migrateInvoiceStatuses(tenantId) {
  const invoices = await prisma.invoice.findMany({
    where: { tenantId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  let migrated = 0;

  for (const invoice of invoices) {
    // Check if invoice already has a status tag
    const hasStatusTag = invoice.tags.some((it) =>
      ["Draft", "Sent", "Viewed", "Paid", "Overdue", "Cancelled"].includes(it.tag.name)
    );

    if (hasStatusTag) {
      continue; // Already has a status tag
    }

    // Get tag name from status field
    const tagName = STATUS_MAPS.invoice[invoice.status?.toLowerCase()] || "Draft";

    // Find the tag
    const tag = await prisma.tag.findFirst({
      where: {
        tenantId,
        name: tagName,
      },
    });

    if (!tag) {
      console.warn(`  ⚠ Tag "${tagName}" not found for tenant ${tenantId}`);
      continue;
    }

    // Add the status tag
    await prisma.invoiceTag.create({
      data: {
        invoiceId: invoice.id,
        tagId: tag.id,
      },
    });

    migrated++;
  }

  return { total: invoices.length, migrated };
}

async function migrateBookingStatuses(tenantId) {
  const bookings = await prisma.booking.findMany({
    where: { tenantId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  let migrated = 0;

  for (const booking of bookings) {
    // Check if booking already has a status tag
    const hasStatusTag = booking.tags.some((bt) =>
      ["Inquiry", "Confirmed", "Completed", "Cancelled", "No Show"].includes(bt.tag.name)
    );

    if (hasStatusTag) {
      continue; // Already has a status tag
    }

    // Get tag name from status field
    const tagName = STATUS_MAPS.booking[booking.status?.toLowerCase()] || "Inquiry";

    // Find the tag
    const tag = await prisma.tag.findFirst({
      where: {
        tenantId,
        name: tagName,
      },
    });

    if (!tag) {
      console.warn(`  ⚠ Tag "${tagName}" not found for tenant ${tenantId}`);
      continue;
    }

    // Add the status tag
    await prisma.bookingTag.create({
      data: {
        bookingId: booking.id,
        tagId: tag.id,
      },
    });

    migrated++;
  }

  return { total: bookings.length, migrated };
}

async function migrateContactStatuses(tenantId) {
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    include: {
      tags: {
        include: { tag: true },
      },
    },
  });

  let migrated = 0;

  for (const contact of contacts) {
    // Check if contact already has a status tag
    const hasStatusTag = contact.tags.some((ct) =>
      ["Lead", "Client", "Inactive"].includes(ct.tag.name)
    );

    if (hasStatusTag) {
      continue; // Already has a status tag
    }

    // Get tag name from status field (default to Lead if no status)
    const tagName = STATUS_MAPS.contact[contact.status?.toLowerCase()] || "Lead";

    // Find the tag
    const tag = await prisma.tag.findFirst({
      where: {
        tenantId,
        name: tagName,
      },
    });

    if (!tag) {
      console.warn(`  ⚠ Tag "${tagName}" not found for tenant ${tenantId}`);
      continue;
    }

    // Add the status tag
    await prisma.contactTag.create({
      data: {
        contactId: contact.id,
        tagId: tag.id,
      },
    });

    migrated++;
  }

  return { total: contacts.length, migrated };
}

async function main() {
  console.log("Starting status → tags migration...\n");

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${tenants.length} tenant(s)\n`);

  for (const tenant of tenants) {
    console.log(`Processing tenant: ${tenant.name || tenant.id}`);

    try {
      const invoiceResults = await migrateInvoiceStatuses(tenant.id);
      console.log(`  ✓ Invoices: ${invoiceResults.migrated}/${invoiceResults.total} migrated`);

      const bookingResults = await migrateBookingStatuses(tenant.id);
      console.log(`  ✓ Bookings: ${bookingResults.migrated}/${bookingResults.total} migrated`);

      const contactResults = await migrateContactStatuses(tenant.id);
      console.log(`  ✓ Contacts: ${contactResults.migrated}/${contactResults.total} migrated`);
    } catch (error) {
      console.error(`  ✗ Error migrating tenant:`, error.message);
    }
  }

  console.log("\n✅ Migration complete!");
  console.log("\nNext steps:");
  console.log("1. Verify tags are correct in the dashboard");
  console.log("2. Status fields can now be marked as deprecated");
  console.log("3. Future versions can remove status fields entirely");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
