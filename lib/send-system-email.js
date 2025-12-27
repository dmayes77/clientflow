/**
 * Helper for sending system template emails
 * Used by cron jobs and automated processes
 */

import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";

/**
 * Send an email using a system template
 *
 * @param {string} tenantId - Tenant ID
 * @param {string} systemKey - System template key (e.g., "payment_reminder_gentle")
 * @param {string} recipientEmail - Recipient email address
 * @param {Object} variables - Template variables (contact, booking, invoice, payment, business, etc.)
 * @returns {Promise<Object>} Result with success status
 */
export async function sendSystemEmail(tenantId, systemKey, recipientEmail, variables = {}) {
  try {
    // Find the system template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        systemKey,
        isSystem: true,
      },
    });

    if (!template) {
      console.error(`System template not found: ${systemKey} for tenant ${tenantId}`);
      return {
        success: false,
        error: `System template "${systemKey}" not found`,
      };
    }

    // Send the email using the template
    const result = await sendTemplatedEmail({
      to: recipientEmail,
      subject: template.subject,
      body: template.body,
      variables,
    });

    return result;
  } catch (error) {
    console.error(`Error sending system email (${systemKey}):`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send payment reminder based on urgency level
 *
 * @param {Object} invoice - Invoice object with contact and tenant relations
 * @param {string} urgency - "gentle", "urgent", or "final"
 */
export async function sendPaymentReminder(invoice, urgency = "gentle") {
  const systemKeyMap = {
    gentle: "payment_reminder_gentle",
    urgent: "payment_reminder_urgent",
    final: "payment_reminder_final",
  };

  const systemKey = systemKeyMap[urgency];
  if (!systemKey) {
    throw new Error(`Invalid urgency level: ${urgency}`);
  }

  // Build variables for the template
  const variables = {
    contact: {
      name: invoice.contact.name || "",
      firstName: invoice.contact.name?.split(" ")[0] || "",
      email: invoice.contact.email || "",
      phone: invoice.contact.phone || "",
    },
    invoice: {
      number: invoice.invoiceNumber || invoice.id?.slice(-8).toUpperCase() || "",
      amount: invoice.total
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(invoice.total / 100)
        : "",
      balanceDue: invoice.balanceDue
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(invoice.balanceDue / 100)
        : "",
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
    },
    business: {
      name: invoice.tenant.businessName || invoice.tenant.name || "",
      email: invoice.tenant.email || "",
      phone: invoice.tenant.businessPhone || "",
      address: [
        invoice.tenant.businessAddress,
        invoice.tenant.businessCity,
        invoice.tenant.businessState,
        invoice.tenant.businessZip,
      ]
        .filter(Boolean)
        .join(", "),
    },
  };

  return sendSystemEmail(
    invoice.tenantId,
    systemKey,
    invoice.contact.email,
    variables
  );
}

/**
 * Send booking confirmation
 *
 * @param {Object} booking - Booking object with contact, tenant, service/package relations
 */
export async function sendBookingConfirmation(booking) {
  const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null;

  const variables = {
    contact: {
      name: booking.contact.name || "",
      firstName: booking.contact.name?.split(" ")[0] || "",
      email: booking.contact.email || "",
      phone: booking.contact.phone || "",
    },
    booking: {
      service: booking.service?.name || booking.package?.name || "Service",
      date: scheduledDate
        ? scheduledDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      time: scheduledDate
        ? scheduledDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      duration: booking.duration ? `${booking.duration} minutes` : "",
      price: booking.totalPrice
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(booking.totalPrice / 100)
        : "",
      confirmationNumber: booking.id?.slice(-8).toUpperCase() || "",
      rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reschedule/${booking.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${booking.id}`,
    },
    business: {
      name: booking.tenant.businessName || booking.tenant.name || "",
      email: booking.tenant.email || "",
      phone: booking.tenant.businessPhone || "",
      address: [
        booking.tenant.businessAddress,
        booking.tenant.businessCity,
        booking.tenant.businessState,
        booking.tenant.businessZip,
      ]
        .filter(Boolean)
        .join(", "),
    },
  };

  return sendSystemEmail(
    booking.tenantId,
    "booking_confirmed",
    booking.contact.email,
    variables
  );
}

/**
 * Send booking reminder (24 hours before)
 *
 * @param {Object} booking - Booking object with contact, tenant, service/package relations
 */
export async function sendBookingReminder(booking) {
  const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null;

  const variables = {
    contact: {
      name: booking.contact.name || "",
      firstName: booking.contact.name?.split(" ")[0] || "",
      email: booking.contact.email || "",
    },
    booking: {
      service: booking.service?.name || booking.package?.name || "Service",
      date: scheduledDate
        ? scheduledDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      time: scheduledDate
        ? scheduledDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reschedule/${booking.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${booking.id}`,
    },
    business: {
      name: booking.tenant.businessName || booking.tenant.name || "",
      phone: booking.tenant.businessPhone || "",
      address: [
        booking.tenant.businessAddress,
        booking.tenant.businessCity,
        booking.tenant.businessState,
        booking.tenant.businessZip,
      ]
        .filter(Boolean)
        .join(", "),
    },
  };

  return sendSystemEmail(
    booking.tenantId,
    "booking_reminder",
    booking.contact.email,
    variables
  );
}

/**
 * Send payment confirmation
 *
 * @param {Object} payment - Payment object with contact and tenant relations
 */
export async function sendPaymentConfirmation(payment) {
  const variables = {
    contact: {
      name: payment.contact.name || "",
      firstName: payment.contact.name?.split(" ")[0] || "",
      email: payment.contact.email || "",
    },
    payment: {
      amount: payment.amount
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(payment.amount / 100)
        : "",
      date: payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      method: payment.cardBrand
        ? `${payment.cardBrand.charAt(0).toUpperCase() + payment.cardBrand.slice(1)} ****${payment.cardLast4}`
        : "Card",
      receiptUrl: payment.stripeReceiptUrl || "",
      confirmationNumber: payment.id?.slice(-8).toUpperCase() || "",
    },
    business: {
      name: payment.tenant.businessName || payment.tenant.name || "",
    },
  };

  return sendSystemEmail(
    payment.tenantId,
    "payment_received",
    payment.contact.email,
    variables
  );
}
