import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push-notifications";

// GET /api/push/subscribe - Get VAPID public key and subscription status
export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications not configured", configured: false },
      { status: 503 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      id: true,
      pushNotificationsEnabled: true,
      notifyPayments: true,
      notifyBookings: true,
      notifySystem: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Get existing subscriptions for this user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { tenantId: tenant.id, clerkUserId: userId },
    select: {
      id: true,
      deviceName: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return NextResponse.json({
    configured: true,
    vapidPublicKey: getVapidPublicKey(),
    enabled: tenant.pushNotificationsEnabled,
    preferences: {
      payments: tenant.notifyPayments,
      bookings: tenant.notifyBookings,
      system: tenant.notifySystem,
    },
    subscriptions,
  });
}

// POST /api/push/subscribe - Subscribe to push notifications
export async function POST(request) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications not configured" },
      { status: 503 }
    );
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { subscription, deviceName } = body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Check if this subscription already exists
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint },
    });

    if (existing) {
      // Update existing subscription
      const updated = await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          deviceName: deviceName || existing.deviceName,
          userAgent: request.headers.get("user-agent"),
          updatedAt: new Date(),
        },
      });

      // Enable push notifications for tenant if not already
      if (!tenant.pushNotificationsEnabled) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { pushNotificationsEnabled: true },
        });
      }

      return NextResponse.json({
        success: true,
        subscriptionId: updated.id,
        updated: true,
      });
    }

    // Create new subscription
    const newSubscription = await prisma.pushSubscription.create({
      data: {
        tenantId: tenant.id,
        clerkUserId: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        deviceName: deviceName || parseDeviceName(request.headers.get("user-agent")),
        userAgent: request.headers.get("user-agent"),
      },
    });

    // Enable push notifications for tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { pushNotificationsEnabled: true },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: newSubscription.id,
      created: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Unsubscribe from push notifications
export async function DELETE(request) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");
    const subscriptionId = searchParams.get("id");

    if (!endpoint && !subscriptionId) {
      return NextResponse.json(
        { error: "Endpoint or subscription ID required" },
        { status: 400 }
      );
    }

    // Delete by endpoint or ID
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: {
          endpoint,
          tenantId: tenant.id,
        },
      });
    } else if (subscriptionId) {
      await prisma.pushSubscription.deleteMany({
        where: {
          id: subscriptionId,
          tenantId: tenant.id,
        },
      });
    }

    // Check if tenant has any remaining subscriptions
    const remainingCount = await prisma.pushSubscription.count({
      where: { tenantId: tenant.id },
    });

    // If no subscriptions left, disable push notifications
    if (remainingCount === 0) {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { pushNotificationsEnabled: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}

/**
 * Parse user agent to get a friendly device name
 */
function parseDeviceName(userAgent) {
  if (!userAgent) return "Unknown device";

  // Mobile devices
  if (/iPhone/.test(userAgent)) return "iPhone";
  if (/iPad/.test(userAgent)) return "iPad";
  if (/Android/.test(userAgent)) {
    if (/Mobile/.test(userAgent)) return "Android Phone";
    return "Android Tablet";
  }

  // Desktop browsers
  if (/Chrome/.test(userAgent)) {
    if (/Mac/.test(userAgent)) return "Chrome on Mac";
    if (/Windows/.test(userAgent)) return "Chrome on Windows";
    if (/Linux/.test(userAgent)) return "Chrome on Linux";
    return "Chrome";
  }
  if (/Firefox/.test(userAgent)) {
    if (/Mac/.test(userAgent)) return "Firefox on Mac";
    if (/Windows/.test(userAgent)) return "Firefox on Windows";
    return "Firefox";
  }
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    return "Safari on Mac";
  }
  if (/Edge/.test(userAgent)) return "Edge";

  return "Unknown browser";
}
