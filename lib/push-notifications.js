import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// VAPID keys for Web Push
// Generate with: npx web-push generate-vapid-keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Configure web-push if VAPID keys are available
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    `mailto:${process.env.SUPPORT_EMAIL || "support@clientflow.app"}`,
    vapidPublicKey,
    vapidPrivateKey
  );
}

/**
 * Check if push notifications are configured
 */
export function isPushConfigured() {
  return !!(vapidPublicKey && vapidPrivateKey);
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey() {
  return vapidPublicKey;
}

/**
 * Send a push notification to a specific subscription
 * @param {Object} subscription - PushSubscription from database
 * @param {Object} payload - Notification payload
 */
async function sendToSubscription(subscription, payload) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));

    // Update last used timestamp
    await prisma.pushSubscription.update({
      where: { id: subscription.id },
      data: { lastUsedAt: new Date() },
    });

    return { success: true, subscriptionId: subscription.id };
  } catch (error) {
    console.error("Push notification error:", error);

    // If subscription is invalid (410 Gone or 404), remove it
    if (error.statusCode === 410 || error.statusCode === 404) {
      await prisma.pushSubscription.delete({
        where: { id: subscription.id },
      }).catch(() => {}); // Ignore if already deleted

      return { success: false, error: "subscription_expired", subscriptionId: subscription.id };
    }

    return { success: false, error: error.message, subscriptionId: subscription.id };
  }
}

/**
 * Send push notification to all subscriptions for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {string} [notification.icon] - Icon URL
 * @param {string} [notification.badge] - Badge URL
 * @param {string} [notification.url] - URL to open on click
 * @param {string} [notification.tag] - Tag for grouping/replacing notifications
 * @param {Object} [notification.data] - Additional data
 */
export async function sendPushToTenant(tenantId, notification) {
  if (!isPushConfigured()) {
    console.warn("Push notifications not configured - missing VAPID keys");
    return { sent: 0, failed: 0, results: [] };
  }

  // Get tenant's push preferences
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { pushNotificationsEnabled: true },
  });

  if (!tenant?.pushNotificationsEnabled) {
    return { sent: 0, failed: 0, skipped: true, reason: "push_disabled" };
  }

  // Get all subscriptions for this tenant
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { tenantId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, results: [] };
  }

  const payload = {
    title: notification.title,
    body: notification.body,
    icon: notification.icon || "/icons/icon-192x192.png",
    badge: notification.badge || "/icons/badge-72x72.png",
    url: notification.url || "/dashboard",
    tag: notification.tag,
    data: notification.data || {},
    timestamp: Date.now(),
  };

  const results = await Promise.all(
    subscriptions.map((sub) => sendToSubscription(sub, payload))
  );

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}

/**
 * Notification types with category checking
 */
const NOTIFICATION_CATEGORIES = {
  // Payment notifications
  payment_received: "payments",
  payment_failed: "payments",
  dispute_created: "payments",
  dispute_won: "payments",
  dispute_lost: "payments",

  // Booking notifications
  booking_created: "bookings",
  booking_cancelled: "bookings",
  booking_confirmed: "bookings",
  booking_reminder: "bookings",

  // System notifications
  trial_expiring: "system",
  trial_expired: "system",
  subscription_cancelled: "system",
  account_issue: "system",
  announcement: "system",
};

/**
 * Check if a tenant should receive a notification of a given type
 */
async function shouldNotify(tenantId, notificationType) {
  const category = NOTIFICATION_CATEGORIES[notificationType];
  if (!category) return true; // Unknown types default to sending

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      pushNotificationsEnabled: true,
      notifyPayments: true,
      notifyBookings: true,
      notifySystem: true,
    },
  });

  if (!tenant?.pushNotificationsEnabled) return false;

  switch (category) {
    case "payments":
      return tenant.notifyPayments;
    case "bookings":
      return tenant.notifyBookings;
    case "system":
      return tenant.notifySystem;
    default:
      return true;
  }
}

/**
 * Send push notification for an alert
 * @param {Object} alert - Alert object
 * @param {string} tenantId - Tenant ID
 */
export async function sendPushForAlert(alert, tenantId) {
  // Check if tenant should receive this type of notification
  const notificationType = alert.type || "system";
  const canNotify = await shouldNotify(tenantId, notificationType);

  if (!canNotify) {
    return { sent: 0, skipped: true, reason: "category_disabled" };
  }

  // Map alert severity to notification styling
  const severityIcons = {
    critical: "/icons/alert-critical.png",
    error: "/icons/alert-error.png",
    warning: "/icons/alert-warning.png",
    info: "/icons/alert-info.png",
  };

  return sendPushToTenant(tenantId, {
    title: alert.title,
    body: alert.message,
    icon: severityIcons[alert.severity] || severityIcons.info,
    url: alert.actionUrl || "/dashboard/alerts",
    tag: `alert-${alert.id}`,
    data: {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
    },
  });
}

/**
 * Send push notification for a payment event
 */
export async function sendPaymentPush(tenantId, { type, amount, clientName }) {
  const canNotify = await shouldNotify(tenantId, type);
  if (!canNotify) return { skipped: true };

  const formattedAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount / 100);

  const messages = {
    payment_received: {
      title: "Payment Received",
      body: `${clientName} paid ${formattedAmount}`,
      url: "/dashboard/payments",
    },
    payment_failed: {
      title: "Payment Failed",
      body: `Payment of ${formattedAmount} from ${clientName} failed`,
      url: "/dashboard/payments",
    },
    dispute_created: {
      title: "Payment Disputed",
      body: `${clientName} disputed a ${formattedAmount} payment`,
      url: "/dashboard/payments",
    },
  };

  const msg = messages[type];
  if (!msg) return { skipped: true, reason: "unknown_type" };

  return sendPushToTenant(tenantId, {
    ...msg,
    tag: `payment-${type}`,
    data: { type, amount, clientName },
  });
}

/**
 * Send push notification for a booking event
 */
export async function sendBookingPush(tenantId, { type, clientName, serviceName, scheduledAt }) {
  const canNotify = await shouldNotify(tenantId, type);
  if (!canNotify) return { skipped: true };

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  const messages = {
    booking_created: {
      title: "New Booking",
      body: `${clientName} booked ${serviceName}${formattedDate ? ` for ${formattedDate}` : ""}`,
      url: "/dashboard/calendar",
    },
    booking_cancelled: {
      title: "Booking Cancelled",
      body: `${clientName} cancelled their ${serviceName} appointment`,
      url: "/dashboard/calendar",
    },
    booking_confirmed: {
      title: "Booking Confirmed",
      body: `${clientName} confirmed their ${serviceName} appointment`,
      url: "/dashboard/calendar",
    },
  };

  const msg = messages[type];
  if (!msg) return { skipped: true, reason: "unknown_type" };

  return sendPushToTenant(tenantId, {
    ...msg,
    tag: `booking-${type}`,
    data: { type, clientName, serviceName, scheduledAt },
  });
}

/**
 * Generate VAPID keys (run once, then add to .env)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
