import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/stripe/terminal/readers/[id] - Get a single reader
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const reader = await prisma.terminalReader.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    }

    // Fetch current status from Stripe
    try {
      const stripeReader = await stripe.terminal.readers.retrieve(
        reader.stripeReaderId,
        { stripeAccount: tenant.stripeAccountId }
      );

      // Update status in our database
      await prisma.terminalReader.update({
        where: { id: reader.id },
        data: {
          status: stripeReader.status,
          ipAddress: stripeReader.ip_address,
          lastSeenAt: stripeReader.status === "online" ? new Date() : reader.lastSeenAt,
        },
      });

      return NextResponse.json({
        reader: {
          id: reader.id,
          stripeReaderId: reader.stripeReaderId,
          label: reader.label,
          serialNumber: stripeReader.serial_number,
          deviceType: stripeReader.device_type,
          status: stripeReader.status,
          ipAddress: stripeReader.ip_address,
          action: stripeReader.action,
          lastSeenAt: reader.lastSeenAt,
          createdAt: reader.createdAt,
        },
      });
    } catch (stripeError) {
      // Return cached data on error
      return NextResponse.json({
        reader: {
          id: reader.id,
          stripeReaderId: reader.stripeReaderId,
          label: reader.label,
          serialNumber: reader.serialNumber,
          deviceType: reader.deviceType,
          status: reader.status,
          ipAddress: reader.ipAddress,
          lastSeenAt: reader.lastSeenAt,
          createdAt: reader.createdAt,
          error: "Could not fetch current status from Stripe",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching Terminal reader:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/stripe/terminal/readers/[id] - Update reader label
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();

    const reader = await prisma.terminalReader.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    }

    // Update label in Stripe
    if (body.label) {
      await stripe.terminal.readers.update(
        reader.stripeReaderId,
        { label: body.label.trim() },
        { stripeAccount: tenant.stripeAccountId }
      );
    }

    // Update in our database
    const updatedReader = await prisma.terminalReader.update({
      where: { id: reader.id },
      data: {
        label: body.label?.trim() || reader.label,
      },
    });

    return NextResponse.json({
      success: true,
      reader: updatedReader,
    });
  } catch (error) {
    console.error("Error updating Terminal reader:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/stripe/terminal/readers/[id] - Delete a reader
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const reader = await prisma.terminalReader.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!reader) {
      return NextResponse.json({ error: "Reader not found" }, { status: 404 });
    }

    try {
      // Delete from Stripe
      await stripe.terminal.readers.del(reader.stripeReaderId, {
        stripeAccount: tenant.stripeAccountId,
      });
    } catch (stripeError) {
      // Ignore if already deleted from Stripe
      if (stripeError.code !== "resource_missing") {
        throw stripeError;
      }
    }

    // Delete from our database
    await prisma.terminalReader.delete({
      where: { id: reader.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Terminal reader:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
