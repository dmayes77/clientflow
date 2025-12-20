import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Admin user IDs that can manage system-wide alerts
const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") || [];

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}

// GET /api/admin/alerts - List all alerts (platform-wide view for admin)
export async function GET(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // dispute, payment_failed, etc.
    const severity = searchParams.get("severity");
    const globalOnly = searchParams.get("globalOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where = {};

    if (globalOnly) {
      where.isGlobal = true;
    }

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    const [alerts, typeCounts, unreadCount, criticalCount] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              businessName: true,
              email: true,
            },
          },
        },
      }),
      prisma.alert.groupBy({
        by: ["type"],
        where: { dismissed: false },
        _count: true,
      }),
      prisma.alert.count({
        where: { read: false, dismissed: false },
      }),
      prisma.alert.count({
        where: {
          severity: { in: ["critical", "error"] },
          dismissed: false,
        },
      }),
    ]);

    return NextResponse.json({
      alerts,
      typeCounts: typeCounts.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
      unreadCount,
      criticalCount,
    });
  } catch (error) {
    console.error("Error fetching admin alerts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/alerts - Create alert (broadcast or per-tenant)
export async function POST(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      type = "announcement",
      severity = "info",
      title,
      message,
      actionUrl,
      actionLabel,
      expiresAt,
      tenantIds, // Array of tenant IDs for per-tenant alerts, or empty/null for broadcast
      broadcast = false, // If true, creates a global alert visible to all
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    if (!["info", "warning", "error", "critical"].includes(severity)) {
      return NextResponse.json(
        { error: "Invalid severity. Use: info, warning, error, or critical" },
        { status: 400 }
      );
    }

    const alertData = {
      type,
      severity,
      title,
      message,
      actionUrl,
      actionLabel,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    let alerts = [];

    if (broadcast || (!tenantIds || tenantIds.length === 0)) {
      // Create a single global broadcast alert
      const alert = await prisma.alert.create({
        data: {
          ...alertData,
          tenantId: null,
          isGlobal: true,
        },
      });
      alerts = [alert];
    } else {
      // Create individual alerts for each specified tenant
      const createPromises = tenantIds.map((tenantId) =>
        prisma.alert.create({
          data: {
            ...alertData,
            tenantId,
            isGlobal: false,
          },
        })
      );
      alerts = await Promise.all(createPromises);
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      broadcast: broadcast || (!tenantIds || tenantIds.length === 0),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin alert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/alerts - Update or dismiss an alert
export async function PATCH(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { alertId, dismissed, ...updates } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Build update data
    const updateData = {};

    // Handle dismiss action
    if (dismissed !== undefined) {
      updateData.dismissed = dismissed;
      if (dismissed) {
        updateData.dismissedAt = new Date();
      }
    }

    // Filter allowed field updates
    const allowedFields = [
      "title",
      "message",
      "severity",
      "actionUrl",
      "actionLabel",
      "expiresAt",
    ];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] =
          field === "expiresAt" && updates[field]
            ? new Date(updates[field])
            : updates[field];
      }
    }

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: updateData,
    });

    return NextResponse.json({ alert });
  } catch (error) {
    console.error("Error updating admin alert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/alerts - Delete an alert
export async function DELETE(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get("alertId");

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId query parameter is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Delete the alert (cascades to dismissals)
    await prisma.alert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting admin alert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
