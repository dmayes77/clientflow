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

// GET /api/admin/alerts - List all global alerts
export async function GET(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get("includeExpired") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const alerts = await prisma.alert.findMany({
      where: {
        isGlobal: true,
        ...(includeExpired
          ? {}
          : {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            }),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        _count: {
          select: { dismissals: true },
        },
      },
    });

    // Get total tenant count for context
    const tenantCount = await prisma.tenant.count();

    return NextResponse.json({
      alerts: alerts.map((alert) => ({
        ...alert,
        dismissalCount: alert._count.dismissals,
        _count: undefined,
      })),
      tenantCount,
    });
  } catch (error) {
    console.error("Error fetching admin alerts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/alerts - Create a new global alert
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

    const alert = await prisma.alert.create({
      data: {
        tenantId: null, // Global alerts have no tenant
        isGlobal: true,
        type,
        severity,
        title,
        message,
        actionUrl,
        actionLabel,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ alert }, { status: 201 });
  } catch (error) {
    console.error("Error creating admin alert:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/alerts - Update a global alert
export async function PATCH(request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { alertId, ...updates } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: "alertId is required" },
        { status: 400 }
      );
    }

    // Verify it's a global alert
    const existing = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (!existing.isGlobal) {
      return NextResponse.json(
        { error: "This route only manages global alerts" },
        { status: 400 }
      );
    }

    // Filter allowed updates
    const allowedFields = [
      "title",
      "message",
      "severity",
      "actionUrl",
      "actionLabel",
      "expiresAt",
    ];
    const updateData = {};
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

// DELETE /api/admin/alerts - Delete a global alert
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

    // Verify it's a global alert
    const existing = await prisma.alert.findUnique({
      where: { id: alertId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    if (!existing.isGlobal) {
      return NextResponse.json(
        { error: "This route only manages global alerts" },
        { status: 400 }
      );
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
