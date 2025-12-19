import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/alerts - Get alerts for tenant (including global alerts)
export async function GET(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const includeDismissed = searchParams.get("includeDismissed") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get tenant-specific alerts (not dismissed)
    const tenantAlerts = await prisma.alert.findMany({
      where: {
        tenantId: tenant.id,
        isGlobal: false,
        ...(includeDismissed ? {} : { dismissed: false }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get global alerts that haven't expired and aren't dismissed by this tenant
    const dismissedGlobalIds = await prisma.globalAlertDismissal.findMany({
      where: { tenantId: tenant.id },
      select: { alertId: true },
    });
    const dismissedIds = dismissedGlobalIds.map(d => d.alertId);

    const globalAlerts = await prisma.alert.findMany({
      where: {
        isGlobal: true,
        id: { notIn: dismissedIds.length > 0 ? dismissedIds : ["none"] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Combine and sort by createdAt
    const allAlerts = [...tenantAlerts, ...globalAlerts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    // Get count of unread alerts
    const tenantUnreadCount = await prisma.alert.count({
      where: {
        tenantId: tenant.id,
        isGlobal: false,
        dismissed: false,
        read: false,
      },
    });

    // Count global alerts not dismissed by this tenant
    const globalUnreadCount = globalAlerts.length;

    return NextResponse.json({
      alerts: allAlerts,
      unreadCount: tenantUnreadCount + globalUnreadCount,
    });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/alerts - Mark alerts as read or dismissed
export async function PATCH(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { alertId, alertIds, action, isGlobal } = body;

    if (!action || !["read", "dismiss", "readAll", "dismissAll"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Handle bulk actions for tenant alerts
    if (action === "readAll") {
      await prisma.alert.updateMany({
        where: {
          tenantId: tenant.id,
          isGlobal: false,
          dismissed: false,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "dismissAll") {
      // Dismiss tenant alerts
      await prisma.alert.updateMany({
        where: {
          tenantId: tenant.id,
          isGlobal: false,
          dismissed: false,
        },
        data: {
          dismissed: true,
          dismissedAt: new Date(),
        },
      });

      // Dismiss all global alerts for this tenant
      const globalAlerts = await prisma.alert.findMany({
        where: { isGlobal: true },
        select: { id: true },
      });

      if (globalAlerts.length > 0) {
        await prisma.globalAlertDismissal.createMany({
          data: globalAlerts.map(a => ({
            alertId: a.id,
            tenantId: tenant.id,
          })),
          skipDuplicates: true,
        });
      }

      return NextResponse.json({ success: true });
    }

    // Handle single alert actions
    const ids = alertIds || (alertId ? [alertId] : []);
    if (ids.length === 0) {
      return NextResponse.json({ error: "No alert ID provided" }, { status: 400 });
    }

    // Check if dismissing a global alert
    if (action === "dismiss" && isGlobal) {
      // Create dismissal records for global alerts
      await prisma.globalAlertDismissal.createMany({
        data: ids.map(id => ({
          alertId: id,
          tenantId: tenant.id,
        })),
        skipDuplicates: true,
      });
      return NextResponse.json({ success: true });
    }

    // For tenant-specific alerts
    const updateData = action === "read"
      ? { read: true, readAt: new Date() }
      : { dismissed: true, dismissedAt: new Date() };

    await prisma.alert.updateMany({
      where: {
        id: { in: ids },
        tenantId: tenant.id,
        isGlobal: false,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating alerts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
