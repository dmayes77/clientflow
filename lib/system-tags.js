/**
 * System Tags Configuration
 * These tags are created automatically for every tenant and cannot be deleted.
 */

import { SUGGESTED_TAGS } from "./data/suggested-tags.js";

export const INVOICE_STATUS_TAGS = [
  {
    name: "Draft",
    color: "gray",
    description: "Invoice has been created but not yet sent",
    type: "invoice",
  },
  {
    name: "Sent",
    color: "blue",
    description: "Invoice has been sent to the client",
    type: "invoice",
  },
  {
    name: "Viewed",
    color: "indigo",
    description: "Client has viewed the invoice",
    type: "invoice",
  },
  {
    name: "Paid",
    color: "green",
    description: "Invoice has been paid",
    type: "invoice",
  },
  {
    name: "Overdue",
    color: "red",
    description: "Invoice is past due date",
    type: "invoice",
  },
  {
    name: "Cancelled",
    color: "gray",
    description: "Invoice has been cancelled",
    type: "invoice",
  },
];

export const BOOKING_STATUS_TAGS = [
  {
    name: "Inquiry",
    color: "yellow",
    description: "Initial inquiry from client",
    type: "booking",
  },
  {
    name: "Confirmed",
    color: "green",
    description: "Booking has been confirmed",
    type: "booking",
  },
  {
    name: "Completed",
    color: "blue",
    description: "Booking has been completed",
    type: "booking",
  },
  {
    name: "Cancelled",
    color: "red",
    description: "Booking has been cancelled",
    type: "booking",
  },
  {
    name: "No Show",
    color: "gray",
    description: "Client did not show up",
    type: "booking",
  },
];

export const CONTACT_STATUS_TAGS = [
  {
    name: "Lead",
    color: "yellow",
    description: "New potential client",
    type: "contact",
  },
  {
    name: "Client",
    color: "green",
    description: "Active client",
    type: "contact",
  },
  {
    name: "Inactive",
    color: "gray",
    description: "Inactive contact",
    type: "contact",
  },
];

export const ALL_SYSTEM_TAGS = [
  ...INVOICE_STATUS_TAGS,
  ...BOOKING_STATUS_TAGS,
  ...CONTACT_STATUS_TAGS,
];

/**
 * Default Tags Configuration
 * These tags are created automatically for every tenant but CAN be deleted by users.
 * They provide helpful organization options but are not required for system functionality.
 */
export const DEFAULT_TAGS = [
  ...SUGGESTED_TAGS.contact,
  ...SUGGESTED_TAGS.invoice,
  ...SUGGESTED_TAGS.booking,
  ...SUGGESTED_TAGS.general,
];

/**
 * Create system and default tags for a tenant
 * System tags (isSystem: true) cannot be deleted - these are for status tracking
 * Default tags (isSystem: false) can be deleted - these are helpful organizational tags
 * @param {object} prisma - Prisma client instance
 * @param {string} tenantId - The tenant ID
 */
/**
 * Map invoice status field values to tag names
 */
const INVOICE_STATUS_TO_TAG = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

/**
 * Map booking status field values to tag names
 */
const BOOKING_STATUS_TO_TAG = {
  inquiry: "Inquiry",
  pending: "Inquiry",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

/**
 * Apply invoice status tag - removes old status tags and adds new one
 * @param {object} prisma - Prisma client instance
 * @param {string} invoiceId - The invoice ID
 * @param {string} tenantId - The tenant ID
 * @param {string} status - The new status (draft, sent, viewed, paid, overdue, cancelled)
 */
export async function applyInvoiceStatusTag(prisma, invoiceId, tenantId, status) {
  const tagName = INVOICE_STATUS_TO_TAG[status];
  if (!tagName) return;

  // Find the tag
  const tag = await prisma.tag.findFirst({
    where: {
      tenantId,
      name: tagName,
      type: "invoice",
      isSystem: true,
    },
  });

  if (!tag) return;

  // Get all invoice status tag names for removal
  const statusTagNames = Object.values(INVOICE_STATUS_TO_TAG);

  // Remove existing status tags
  await prisma.invoiceTag.deleteMany({
    where: {
      invoiceId,
      tag: {
        name: { in: statusTagNames },
        isSystem: true,
      },
    },
  });

  // Add new status tag
  await prisma.invoiceTag.upsert({
    where: {
      invoiceId_tagId: {
        invoiceId,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      invoiceId,
      tagId: tag.id,
    },
  });
}

/**
 * Apply booking status tag - removes old status tags and adds new one
 * @param {object} prisma - Prisma client instance
 * @param {string} bookingId - The booking ID
 * @param {string} tenantId - The tenant ID
 * @param {string} status - The new status (inquiry, pending, confirmed, completed, cancelled, no_show)
 */
export async function applyBookingStatusTag(prisma, bookingId, tenantId, status) {
  const tagName = BOOKING_STATUS_TO_TAG[status];
  if (!tagName) return;

  // Find the tag
  const tag = await prisma.tag.findFirst({
    where: {
      tenantId,
      name: tagName,
      type: "booking",
      isSystem: true,
    },
  });

  if (!tag) return;

  // Get all booking status tag names for removal
  const statusTagNames = Object.values(BOOKING_STATUS_TO_TAG);

  // Remove existing status tags
  await prisma.bookingTag.deleteMany({
    where: {
      bookingId,
      tag: {
        name: { in: statusTagNames },
        isSystem: true,
      },
    },
  });

  // Add new status tag
  await prisma.bookingTag.upsert({
    where: {
      bookingId_tagId: {
        bookingId,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      bookingId,
      tagId: tag.id,
    },
  });
}

/**
 * Create system and default tags for a tenant
 * System tags (isSystem: true) cannot be deleted - these are for status tracking
 * Default tags (isSystem: false) can be deleted - these are helpful organizational tags
 * @param {object} prisma - Prisma client instance
 * @param {string} tenantId - The tenant ID
 */
export async function createSystemTagsForTenant(prisma, tenantId) {
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

