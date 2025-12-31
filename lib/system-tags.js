/**
 * System Tags Configuration
 * These tags are created automatically for every tenant and cannot be deleted.
 */

import { SUGGESTED_TAGS } from "./data/suggested-tags.js";
import { triggerWorkflows } from "./workflow-executor.js";

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
    name: "Deposit Paid",
    color: "yellow",
    description: "Deposit has been paid, balance remaining",
    type: "invoice",
  },
  {
    name: "Paid",
    color: "green",
    description: "Invoice has been paid in full",
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
    name: "Pending",
    color: "yellow",
    description: "Booking created, awaiting payment",
    type: "booking",
  },
  {
    name: "Scheduled",
    color: "blue",
    description: "Deposit paid, awaiting client confirmation",
    type: "booking",
  },
  {
    name: "Confirmed",
    color: "green",
    description: "Client has confirmed attendance",
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

export const PAYMENT_STATUS_TAGS = [
  {
    name: "Succeeded",
    color: "green",
    description: "Payment was successful",
    type: "payment",
  },
  {
    name: "Failed",
    color: "red",
    description: "Payment failed",
    type: "payment",
  },
  {
    name: "Refunded",
    color: "orange",
    description: "Payment was refunded",
    type: "payment",
  },
  {
    name: "Disputed",
    color: "red",
    description: "Payment is disputed",
    type: "payment",
  },
];

export const ALL_SYSTEM_TAGS = [
  ...INVOICE_STATUS_TAGS,
  ...BOOKING_STATUS_TAGS,
  ...CONTACT_STATUS_TAGS,
  ...PAYMENT_STATUS_TAGS,
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
  deposit_paid: "Deposit Paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

/**
 * Map booking status field values to tag names
 */
const BOOKING_STATUS_TO_TAG = {
  pending: "Pending",
  inquiry: "Pending", // Legacy - treat inquiries as pending bookings
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

/**
 * Apply invoice status tag - removes old status tags and adds new one
 * Also triggers invoice_tag_added workflows for the new tag
 * @param {object} prisma - Prisma client instance
 * @param {string} invoiceId - The invoice ID
 * @param {string} tenantId - The tenant ID
 * @param {string} status - The new status (draft, sent, viewed, paid, overdue, cancelled)
 * @param {object} options - Optional context for workflow triggering
 * @param {object} options.tenant - Tenant object (if not provided, will be fetched)
 * @param {object} options.invoice - Invoice object (if not provided, will be fetched)
 */
export async function applyInvoiceStatusTag(prisma, invoiceId, tenantId, status, options = {}) {
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

  // Check if this tag is already on the invoice (to avoid re-triggering workflows)
  const existingTag = await prisma.invoiceTag.findUnique({
    where: {
      invoiceId_tagId: {
        invoiceId,
        tagId: tag.id,
      },
    },
  });

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

  // Trigger invoice_tag_added workflow if this is a new tag (not already present)
  if (!existingTag) {
    try {
      // Fetch context if not provided
      const tenant = options.tenant || await prisma.tenant.findUnique({ where: { id: tenantId } });
      const invoice = options.invoice || await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { contact: true },
      });

      if (tenant && invoice) {
        triggerWorkflows("invoice_tag_added", {
          tenant,
          invoice,
          contact: invoice.contact,
          tag,
        }).catch((err) => {
          console.error("Error triggering invoice_tag_added workflow:", err);
        });
      }
    } catch (err) {
      console.error("Error triggering invoice_tag_added workflow:", err);
    }
  }
}

/**
 * Apply booking status tag - removes old status tags and adds new one
 * Also triggers booking_tag_added workflows for the new tag
 * @param {object} prisma - Prisma client instance
 * @param {string} bookingId - The booking ID
 * @param {string} tenantId - The tenant ID
 * @param {string} status - The new status (inquiry, pending, confirmed, completed, cancelled, no_show)
 * @param {object} options - Optional context for workflow triggering
 * @param {object} options.tenant - Tenant object (if not provided, will be fetched)
 * @param {object} options.booking - Booking object (if not provided, will be fetched)
 */
export async function applyBookingStatusTag(prisma, bookingId, tenantId, status, options = {}) {
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

  // Get all booking status tag names for removal (includes legacy "Inquiry" tag)
  const statusTagNames = [...new Set([...Object.values(BOOKING_STATUS_TO_TAG), "Inquiry"])];

  // Check if this tag is already on the booking (to avoid re-triggering workflows)
  const existingTag = await prisma.bookingTag.findUnique({
    where: {
      bookingId_tagId: {
        bookingId,
        tagId: tag.id,
      },
    },
  });

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

  // Trigger booking_tag_added workflow if this is a new tag (not already present)
  if (!existingTag) {
    try {
      // Fetch context if not provided
      const tenant = options.tenant || await prisma.tenant.findUnique({ where: { id: tenantId } });
      const booking = options.booking || await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { contact: true, service: true, package: true },
      });

      if (tenant && booking) {
        triggerWorkflows("booking_tag_added", {
          tenant,
          booking,
          contact: booking.contact,
          tag,
        }).catch((err) => {
          console.error("Error triggering booking_tag_added workflow:", err);
        });
      }
    } catch (err) {
      console.error("Error triggering booking_tag_added workflow:", err);
    }
  }
}

/**
 * Map payment status to corresponding system tag name
 */
export const PAYMENT_STATUS_TO_TAG = {
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  disputed: "Disputed",
};

/**
 * Apply a status tag to a payment
 * Removes any existing payment status tags before applying the new one
 * Also triggers payment_tag_added workflows for the new tag
 * @param {object} prisma - Prisma client instance
 * @param {string} paymentId - The payment ID
 * @param {string} tenantId - The tenant ID
 * @param {string} status - The payment status (succeeded, failed, refunded, disputed)
 * @param {object} options - Optional context for workflow triggering
 * @param {object} options.tenant - Tenant object (if not provided, will be fetched)
 * @param {object} options.payment - Payment object (if not provided, will be fetched)
 */
export async function applyPaymentStatusTag(prisma, paymentId, tenantId, status, options = {}) {
  const tagName = PAYMENT_STATUS_TO_TAG[status];
  if (!tagName) return;

  // Find the tag
  const tag = await prisma.tag.findFirst({
    where: {
      tenantId,
      name: tagName,
      type: "payment",
      isSystem: true,
    },
  });

  if (!tag) return;

  // Get all payment status tag names for removal
  const statusTagNames = Object.values(PAYMENT_STATUS_TO_TAG);

  // Check if this tag is already on the payment (to avoid re-triggering workflows)
  const existingTag = await prisma.paymentTag.findUnique({
    where: {
      paymentId_tagId: {
        paymentId,
        tagId: tag.id,
      },
    },
  });

  // Remove existing status tags
  await prisma.paymentTag.deleteMany({
    where: {
      paymentId,
      tag: {
        name: { in: statusTagNames },
        isSystem: true,
      },
    },
  });

  // Add new status tag
  await prisma.paymentTag.upsert({
    where: {
      paymentId_tagId: {
        paymentId,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      paymentId,
      tagId: tag.id,
    },
  });

  // Trigger payment_tag_added workflow if this is a new tag (not already present)
  if (!existingTag) {
    try {
      // Fetch context if not provided
      const tenant = options.tenant || await prisma.tenant.findUnique({ where: { id: tenantId } });
      const payment = options.payment || await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { contact: true, invoice: true },
      });

      if (tenant && payment) {
        triggerWorkflows("payment_tag_added", {
          tenant,
          payment,
          contact: payment.contact,
          tag,
        }).catch((err) => {
          console.error("Error triggering payment_tag_added workflow:", err);
        });
      }
    } catch (err) {
      console.error("Error triggering payment_tag_added workflow:", err);
    }
  }
}

/**
 * Convert a Lead contact to a Client
 * Removes Lead tag, adds Client tag, and triggers client_converted workflow
 * Should be called when a contact makes their first payment
 * @param {object} prisma - Prisma client instance
 * @param {string} contactId - The contact ID
 * @param {string} tenantId - The tenant ID
 * @param {object} options - Optional context
 * @param {object} options.tenant - Tenant object (if not provided, will be fetched)
 * @param {object} options.contact - Contact object (if not provided, will be fetched)
 * @returns {boolean} - True if conversion happened, false if already a client or not a lead
 */
export async function convertLeadToClient(prisma, contactId, tenantId, options = {}) {
  try {
    // Find the Lead and Client tags
    const [leadTag, clientTag] = await Promise.all([
      prisma.tag.findFirst({
        where: { tenantId, name: "Lead", type: "contact", isSystem: true },
      }),
      prisma.tag.findFirst({
        where: { tenantId, name: "Client", type: "contact", isSystem: true },
      }),
    ]);

    if (!leadTag || !clientTag) {
      console.error("Lead or Client tags not found for tenant:", tenantId);
      return false;
    }

    // Check if contact has Lead tag and doesn't have Client tag
    const [hasLeadTag, hasClientTag] = await Promise.all([
      prisma.contactTag.findUnique({
        where: { contactId_tagId: { contactId, tagId: leadTag.id } },
      }),
      prisma.contactTag.findUnique({
        where: { contactId_tagId: { contactId, tagId: clientTag.id } },
      }),
    ]);

    // Already a client or not a lead
    if (hasClientTag || !hasLeadTag) {
      return false;
    }

    // Remove Lead tag
    await prisma.contactTag.delete({
      where: { contactId_tagId: { contactId, tagId: leadTag.id } },
    });

    // Add Client tag
    await prisma.contactTag.create({
      data: { contactId, tagId: clientTag.id },
    });

    // Trigger client_converted workflow
    const tenant = options.tenant || await prisma.tenant.findUnique({ where: { id: tenantId } });
    const contact = options.contact || await prisma.contact.findUnique({ where: { id: contactId } });

    if (tenant && contact) {
      triggerWorkflows("client_converted", {
        tenant,
        contact,
        tag: clientTag,
      }).catch((err) => {
        console.error("Error triggering client_converted workflow:", err);
      });
    }

    return true;
  } catch (err) {
    console.error("Error converting lead to client:", err);
    return false;
  }
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

