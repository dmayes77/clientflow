import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Supported webhook events
export const WEBHOOK_EVENTS = {
  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_CONFIRMED: "booking.confirmed",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_RESCHEDULED: "booking.rescheduled",
  BOOKING_COMPLETED: "booking.completed",

  // Client events
  CLIENT_CREATED: "client.created",
  CLIENT_UPDATED: "client.updated",

  // Payment events
  PAYMENT_RECEIVED: "payment.received",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Invoice events
  INVOICE_SENT: "invoice.sent",
  INVOICE_PAID: "invoice.paid",
  INVOICE_OVERDUE: "invoice.overdue",
};

// All events as an array for validation
export const ALL_WEBHOOK_EVENTS = Object.values(WEBHOOK_EVENTS);

/**
 * Generate a webhook signing secret
 */
export function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(24).toString("hex")}`;
}

/**
 * Trigger a webhook event for a tenant
 * @param {string} tenantId - The tenant ID
 * @param {string} event - The event type (e.g., "booking.created")
 * @param {object} data - The event data
 */
export async function triggerWebhook(tenantId, event, data) {
  try {
    // Find all active webhooks for this tenant that are subscribed to this event
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
      return { dispatched: 0 };
    }

    // Trigger each webhook
    const deliveryPromises = webhooks.map((webhook) =>
      deliverWebhook(webhook, event, data)
    );

    // Don't await - fire and forget to avoid blocking the main request
    Promise.all(deliveryPromises).catch((error) => {
      console.error("Error delivering webhooks:", error);
    });

    return { dispatched: webhooks.length };
  } catch (error) {
    console.error("Error triggering webhooks:", error);
    return { dispatched: 0, error: error.message };
  }
}

/**
 * Deliver a webhook to a URL
 * @param {object} webhook - The webhook configuration
 * @param {string} event - The event type
 * @param {object} data - The event data
 */
async function deliverWebhook(webhook, event, data) {
  const payload = {
    id: `evt_${crypto.randomBytes(16).toString("hex")}`,
    type: event,
    created: new Date().toISOString(),
    data,
  };

  const payloadString = JSON.stringify(payload);

  // Generate timestamp and signature for payload verification
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(signedPayload)
    .digest("hex");

  const signatureHeader = `t=${timestamp},v1=${signature}`;

  let attempt = 1;
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signatureHeader,
          "X-Webhook-Event": event,
          "User-Agent": "ClientFlow-Webhooks/1.0",
        },
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const responseText = await response.text().catch(() => "");

      // Log the delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payloadString,
          response: responseText.substring(0, 1000), // Limit response size
          statusCode: response.status,
          success: response.ok,
          attempts: attempt,
        },
      });

      // If successful, break the loop
      if (response.ok) {
        return { success: true, statusCode: response.status };
      }

      // If not successful and we have attempts left, wait before retrying
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    } catch (error) {
      // Log the failed delivery
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: payloadString,
          response: error.message,
          statusCode: null,
          success: false,
          attempts: attempt,
        },
      });

      // If we have attempts left, wait before retrying
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    attempt++;
  }

  return { success: false, attempts: maxAttempts };
}

/**
 * Verify a webhook signature
 * @param {string} payload - The payload string
 * @param {string} signatureHeader - The signature header (t=...,v1=...)
 * @param {string} secret - The webhook secret
 * @param {number} tolerance - Timestamp tolerance in seconds (default 5 minutes)
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, signatureHeader, secret, tolerance = 300) {
  const parts = signatureHeader.split(",");
  const timestamp = parseInt(parts.find((p) => p.startsWith("t="))?.split("=")[1] || "0");
  const signature = parts.find((p) => p.startsWith("v1="))?.split("=")[1];

  if (!timestamp || !signature) {
    return false;
  }

  // Check timestamp is within tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Test a webhook endpoint
 * @param {string} url - Webhook URL to test
 * @param {string} secret - Webhook secret
 */
export async function testWebhook(url, secret) {
  const testPayload = {
    id: `evt_test_${crypto.randomBytes(8).toString("hex")}`,
    type: "webhook.test",
    created: new Date().toISOString(),
    data: {
      message: "This is a test webhook from ClientFlow",
    },
  };

  const payloadString = JSON.stringify(testPayload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": `t=${timestamp},v1=${signature}`,
        "X-Webhook-Event": "webhook.test",
        "User-Agent": "ClientFlow-Webhooks/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(10000),
    });

    return {
      success: res.ok,
      statusCode: res.status,
      message: res.ok ? "Webhook test successful" : `Received status ${res.status}`,
    };
  } catch (error) {
    return {
      success: false,
      statusCode: 0,
      message: error.message,
    };
  }
}

// ==========================================
// Helper functions for dispatching events
// ==========================================

export async function dispatchBookingCreated(tenantId, booking) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.BOOKING_CREATED, {
    booking: {
      id: booking.id,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      totalPrice: booking.totalPrice,
      duration: booking.duration,
      notes: booking.notes,
      service: booking.service ? { id: booking.service.id, name: booking.service.name } : null,
      package: booking.package ? { id: booking.package.id, name: booking.package.name } : null,
      client: booking.client
        ? { id: booking.client.id, name: booking.client.name, email: booking.client.email }
        : null,
    },
  });
}

export async function dispatchBookingConfirmed(tenantId, booking) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.BOOKING_CONFIRMED, {
    booking: {
      id: booking.id,
      scheduledAt: booking.scheduledAt,
      status: booking.status,
      totalPrice: booking.totalPrice,
      client: booking.client
        ? { id: booking.client.id, name: booking.client.name, email: booking.client.email }
        : null,
    },
  });
}

export async function dispatchBookingCancelled(tenantId, booking, cancelledBy = "business") {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.BOOKING_CANCELLED, {
    booking: {
      id: booking.id,
      scheduledAt: booking.scheduledAt,
      status: "cancelled",
      cancelledBy,
      client: booking.client
        ? { id: booking.client.id, name: booking.client.name, email: booking.client.email }
        : null,
    },
  });
}

export async function dispatchBookingRescheduled(tenantId, booking, previousScheduledAt) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.BOOKING_RESCHEDULED, {
    booking: {
      id: booking.id,
      previousScheduledAt,
      newScheduledAt: booking.scheduledAt,
      status: booking.status,
      client: booking.client
        ? { id: booking.client.id, name: booking.client.name, email: booking.client.email }
        : null,
    },
  });
}

export async function dispatchClientCreated(tenantId, client) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.CLIENT_CREATED, {
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdAt,
    },
  });
}

export async function dispatchPaymentReceived(tenantId, payment) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.PAYMENT_RECEIVED, {
    payment: {
      id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      clientEmail: payment.clientEmail,
      clientName: payment.clientName,
      createdAt: payment.createdAt,
    },
  });
}

export async function dispatchInvoicePaid(tenantId, invoice) {
  return triggerWebhook(tenantId, WEBHOOK_EVENTS.INVOICE_PAID, {
    invoice: {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      currency: invoice.currency,
      paidAt: invoice.paidAt,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
    },
  });
}
