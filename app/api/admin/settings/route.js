import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET - Fetch platform settings
export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
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
    if (!(await isAdminAuthenticated())) {
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

    const updateData = {};
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
