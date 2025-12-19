import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/stripe/terminal/readers - List all readers
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check if tenant has Stripe Connect and Terminal location set up
    if (!tenant.stripeAccountId || !tenant.stripeTerminalLocationId) {
      return NextResponse.json({ readers: [] });
    }

    // Get readers from our database
    const dbReaders = await prisma.terminalReader.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    // Fetch current status from Stripe for each reader
    const readers = await Promise.all(
      dbReaders.map(async (reader) => {
        try {
          const stripeReader = await stripe.terminal.readers.retrieve(
            reader.stripeReaderId,
            { stripeAccount: tenant.stripeAccountId }
          );

          // Update status in our database
          const isOnline = stripeReader.status === "online";
          if (reader.status !== stripeReader.status || reader.ipAddress !== stripeReader.ip_address) {
            await prisma.terminalReader.update({
              where: { id: reader.id },
              data: {
                status: stripeReader.status,
                ipAddress: stripeReader.ip_address,
                lastSeenAt: isOnline ? new Date() : reader.lastSeenAt,
              },
            });
          }

          return {
            id: reader.id,
            stripeReaderId: reader.stripeReaderId,
            label: reader.label,
            serialNumber: stripeReader.serial_number,
            deviceType: stripeReader.device_type,
            status: stripeReader.status,
            ipAddress: stripeReader.ip_address,
            lastSeenAt: reader.lastSeenAt,
            createdAt: reader.createdAt,
          };
        } catch (stripeError) {
          // Reader may have been deleted from Stripe
          if (stripeError.code === "resource_missing") {
            await prisma.terminalReader.delete({
              where: { id: reader.id },
            });
            return null;
          }
          // Return cached data on error
          return {
            id: reader.id,
            stripeReaderId: reader.stripeReaderId,
            label: reader.label,
            serialNumber: reader.serialNumber,
            deviceType: reader.deviceType,
            status: reader.status,
            ipAddress: reader.ipAddress,
            lastSeenAt: reader.lastSeenAt,
            createdAt: reader.createdAt,
            error: "Could not fetch current status",
          };
        }
      })
    );

    // Filter out deleted readers
    const validReaders = readers.filter((r) => r !== null);

    return NextResponse.json({ readers: validReaders });
  } catch (error) {
    console.error("Error fetching Terminal readers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/stripe/terminal/readers - Register a new reader
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check if tenant has Stripe Connect set up
    if (!tenant.stripeAccountId || !tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Please connect your Stripe account first" },
        { status: 400 }
      );
    }

    // Check if Terminal location exists
    if (!tenant.stripeTerminalLocationId) {
      return NextResponse.json(
        { error: "Please set up a Terminal location first" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { registrationCode, label } = body;

    if (!registrationCode) {
      return NextResponse.json(
        { error: "Registration code is required" },
        { status: 400 }
      );
    }

    if (!label) {
      return NextResponse.json(
        { error: "Reader label is required" },
        { status: 400 }
      );
    }

    // Register the reader with Stripe
    const stripeReader = await stripe.terminal.readers.create(
      {
        registration_code: registrationCode.trim(),
        label: label.trim(),
        location: tenant.stripeTerminalLocationId,
      },
      { stripeAccount: tenant.stripeAccountId }
    );

    // Save to our database
    const reader = await prisma.terminalReader.create({
      data: {
        tenantId: tenant.id,
        stripeReaderId: stripeReader.id,
        label: label.trim(),
        serialNumber: stripeReader.serial_number,
        deviceType: stripeReader.device_type,
        status: stripeReader.status,
        ipAddress: stripeReader.ip_address,
      },
    });

    return NextResponse.json({
      success: true,
      reader: {
        id: reader.id,
        stripeReaderId: reader.stripeReaderId,
        label: reader.label,
        serialNumber: reader.serialNumber,
        deviceType: reader.deviceType,
        status: reader.status,
        ipAddress: reader.ipAddress,
        createdAt: reader.createdAt,
      },
    });
  } catch (error) {
    console.error("Error registering Terminal reader:", error);

    // Handle specific Stripe errors
    if (error.type === "StripeInvalidRequestError") {
      if (error.message.includes("registration_code")) {
        return NextResponse.json(
          { error: "Invalid registration code. Please check and try again." },
          { status: 400 }
        );
      }
      if (error.message.includes("already registered")) {
        return NextResponse.json(
          { error: "This reader is already registered." },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
