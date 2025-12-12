import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload, secret, timestamp) {
  const data = `${timestamp}.${JSON.stringify(payload)}`;
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

/**
 * Verify webhook signature (for receiving webhooks)
 */
export function verifyWebhookSignature(
  payload,
  signature,
  secret,
  timestamp,
  tolerance = 300 // 5 minutes
) {
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);

  // Check timestamp is within tolerance
  if (Math.abs(now - ts) > tolerance) {
    return false;
  }

  const expectedSignature = generateSignature(payload, secret, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Deliver a webhook to a specific endpoint
 * Includes retry logic with exponential backoff
 */
async function deliverWebhook(webhook, event, payload, maxAttempts = 3) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(payload, webhook.secret, timestamp);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Event": event,
          "X-Webhook-Signature": signature,
          "X-Webhook-Timestamp": timestamp.toString(),
          "X-Webhook-ID": webhook.id,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const responseText = await response.text().catch(() => "");

      // Log the delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: JSON.stringify(payload).slice(0, 10000),
          response: responseText.slice(0, 1000),
          statusCode: response.status,
          success: response.ok,
          attempts: attempt,
        },
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // If not successful and more attempts, wait before retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    } catch (error) {
      // Log failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: JSON.stringify(payload).slice(0, 10000),
          response: error.message?.slice(0, 1000) || "Request failed",
          statusCode: null,
          success: false,
          attempts: attempt,
        },
      });

      // Wait before retry
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  return { success: false };
}

/**
 * Trigger webhooks for a specific event
 * Dispatches asynchronously without blocking
 */
export async function triggerWebhook(tenantId, event, payload) {
  try {
    // Find all active webhooks for this tenant subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        tenantId,
        active: true,
        events: {
          has: event,
        },
      },
    });

    if (webhooks.length === 0) {
      return 0;
    }

    // Dispatch webhooks asynchronously (fire and forget)
    for (const webhook of webhooks) {
      // Don't await - let it run in background
      deliverWebhook(webhook, event, payload).catch((error) => {
        console.error(`Webhook delivery failed for ${webhook.id}:`, error);
      });
    }

    return webhooks.length;
  } catch (error) {
    console.error("Error triggering webhooks:", error);
    return 0;
  }
}

/**
 * Event dispatcher helpers
 */

export async function dispatchBookingCreated(tenantId, booking) {
  return triggerWebhook(tenantId, "booking.created", {
    type: "booking.created",
    data: {
      id: booking.id,
      contactId: booking.contactId,
      contactName: booking.contact?.name,
      contactEmail: booking.contact?.email,
      serviceId: booking.serviceId,
      serviceName: booking.service?.name,
      packageId: booking.packageId,
      packageName: booking.package?.name,
      scheduledAt: booking.scheduledAt,
      duration: booking.duration,
      totalPrice: booking.totalPrice,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchBookingConfirmed(tenantId, booking) {
  return triggerWebhook(tenantId, "booking.confirmed", {
    type: "booking.confirmed",
    data: {
      id: booking.id,
      contactId: booking.contactId,
      contactName: booking.contact?.name,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchBookingCancelled(tenantId, booking) {
  return triggerWebhook(tenantId, "booking.cancelled", {
    type: "booking.cancelled",
    data: {
      id: booking.id,
      contactId: booking.contactId,
      contactName: booking.contact?.name,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchBookingRescheduled(tenantId, booking, previousDate) {
  return triggerWebhook(tenantId, "booking.rescheduled", {
    type: "booking.rescheduled",
    data: {
      id: booking.id,
      contactId: booking.contactId,
      contactName: booking.contact?.name,
      previousScheduledAt: previousDate,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchBookingCompleted(tenantId, booking) {
  return triggerWebhook(tenantId, "booking.completed", {
    type: "booking.completed",
    data: {
      id: booking.id,
      contactId: booking.contactId,
      contactName: booking.contact?.name,
      scheduledAt: booking.scheduledAt,
      totalPrice: booking.totalPrice,
      status: booking.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchContactCreated(tenantId, contact) {
  return triggerWebhook(tenantId, "contact.created", {
    type: "contact.created",
    data: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      createdAt: contact.createdAt,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchContactUpdated(tenantId, contact) {
  return triggerWebhook(tenantId, "contact.updated", {
    type: "contact.updated",
    data: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      updatedAt: contact.updatedAt,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchPaymentReceived(tenantId, payment) {
  return triggerWebhook(tenantId, "payment.received", {
    type: "payment.received",
    data: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactName: payment.contactName,
      contactEmail: payment.contactEmail,
      bookingId: payment.bookingId,
      status: payment.status,
      createdAt: payment.createdAt,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchPaymentFailed(tenantId, payment) {
  return triggerWebhook(tenantId, "payment.failed", {
    type: "payment.failed",
    data: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactEmail: payment.contactEmail,
      status: payment.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchPaymentRefunded(tenantId, payment) {
  return triggerWebhook(tenantId, "payment.refunded", {
    type: "payment.refunded",
    data: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      contactEmail: payment.contactEmail,
      status: payment.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchInvoiceSent(tenantId, invoice) {
  return triggerWebhook(tenantId, "invoice.sent", {
    type: "invoice.sent",
    data: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      dueDate: invoice.dueDate,
      status: invoice.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchInvoicePaid(tenantId, invoice) {
  return triggerWebhook(tenantId, "invoice.paid", {
    type: "invoice.paid",
    data: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      paidAt: invoice.paidAt,
      status: invoice.status,
    },
    createdAt: new Date().toISOString(),
  });
}

export async function dispatchInvoiceOverdue(tenantId, invoice) {
  return triggerWebhook(tenantId, "invoice.overdue", {
    type: "invoice.overdue",
    data: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      dueDate: invoice.dueDate,
      status: invoice.status,
    },
    createdAt: new Date().toISOString(),
  });
}
