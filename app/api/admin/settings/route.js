import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return { isAdmin: false, userId: null };
  return { isAdmin: ADMIN_USER_IDS.includes(userId), userId };
}

// GET - Fetch platform settings
export async function GET() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get or create settings (singleton pattern)
    let settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
    });

    if (!settings) {
      settings = await prisma.platformSettings.create({
        data: { id: "platform" },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update platform settings
export async function PATCH(request) {
  try {
    const { isAdmin: admin, userId } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Allowed fields to update
    const allowedFields = [
      "maintenanceMode",
      "maintenanceMessage",
      "maintenanceEndTime",
      "signupsEnabled",
      "newTrialsEnabled",
      "paymentsEnabled",
      "bookingsEnabled",
      "trialDays",
      "requirePaymentMethod",
      "platformName",
      "supportEmail",
      "supportUrl",
      "maxTenantsPerDay",
      "maxBookingsPerTenant",
    ];

    const updateData = { updatedBy: userId };
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "maintenanceEndTime" && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "platform" },
      create: { id: "platform", ...updateData },
      update: updateData,
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
