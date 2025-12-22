import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/push/preferences - Get notification preferences
export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
    select: {
      pushNotificationsEnabled: true,
      notifyPayments: true,
      notifyBookings: true,
      notifySystem: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json({
    enabled: tenant.pushNotificationsEnabled,
    payments: tenant.notifyPayments,
    bookings: tenant.notifyBookings,
    system: tenant.notifySystem,
  });
}

// PATCH /api/push/preferences - Update notification preferences
export async function PATCH(request) {
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
    const body = await request.json();
    const { enabled, payments, bookings, system } = body;

    const updateData = {};

    if (typeof enabled === "boolean") {
      updateData.pushNotificationsEnabled = enabled;
    }
    if (typeof payments === "boolean") {
      updateData.notifyPayments = payments;
    }
    if (typeof bookings === "boolean") {
      updateData.notifyBookings = bookings;
    }
    if (typeof system === "boolean") {
      updateData.notifySystem = system;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid preferences provided" },
        { status: 400 }
      );
    }

    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
      select: {
        pushNotificationsEnabled: true,
        notifyPayments: true,
        notifyBookings: true,
        notifySystem: true,
      },
    });

    return NextResponse.json({
      enabled: updated.pushNotificationsEnabled,
      payments: updated.notifyPayments,
      bookings: updated.notifyBookings,
      system: updated.notifySystem,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
