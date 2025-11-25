import { prisma } from "@/lib/prisma";
import crypto from "crypto";

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

    // Trigger each webhook
    const deliveryPromises = webhooks.map((webhook) =>
      deliverWebhook(webhook, event, data)
    );

    // Don't await - fire and forget to avoid blocking the main request
    Promise.all(deliveryPromises).catch((error) => {
      console.error("Error delivering webhooks:", error);
    });
  } catch (error) {
    console.error("Error triggering webhooks:", error);
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
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);

  // Generate signature for payload verification
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(payloadString)
    .digest("hex");

  let attempt = 1;
  const maxAttempts = 3;

  while (attempt <= maxAttempts) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": signature,
          "X-Webhook-Event": event,
        },
        body: payloadString,
        signal: AbortSignal.timeout(5000), // 5 second timeout
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
        break;
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
}

/**
 * Verify a webhook signature
 * @param {string} payload - The payload string
 * @param {string} signature - The signature to verify
 * @param {string} secret - The webhook secret
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
