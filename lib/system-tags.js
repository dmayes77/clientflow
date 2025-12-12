/**
 * System Tags Configuration
 * These tags are created automatically for every tenant and cannot be deleted.
 */

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
 * Create system tags for a tenant
 * @param {object} prisma - Prisma client instance
 * @param {string} tenantId - The tenant ID
 */
export async function createSystemTagsForTenant(prisma, tenantId) {
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

/**
 * Get the invoice status tag name from legacy status
 */
export function getInvoiceStatusTagName(status) {
  const map = {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    paid: "Paid",
    overdue: "Overdue",
    cancelled: "Cancelled",
  };
  return map[status] || "Draft";
}

/**
 * Get legacy status from invoice status tag name
 */
export function getLegacyStatusFromTag(tagName) {
  const map = {
    Draft: "draft",
    Sent: "sent",
    Viewed: "viewed",
    Paid: "paid",
    Overdue: "overdue",
    Cancelled: "cancelled",
  };
  return map[tagName] || "draft";
}
