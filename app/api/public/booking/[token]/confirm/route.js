import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyBookingStatusTag } from "@/lib/system-tags";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { sendSystemEmail } from "@/lib/send-system-email";

/**
 * POST /api/public/booking/[token]/confirm
 * Confirm a booking via confirmation token (public endpoint)
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Find booking by confirmation token
    const booking = await prisma.booking.findUnique({
      where: { confirmationToken: token },
      include: {
        tenant: true,
        contact: true,
        service: true,
        package: true,
        services: { include: { service: true } },
        packages: { include: { package: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be confirmed
    if (booking.status === "confirmed") {
      return NextResponse.json({
        success: true,
        message: "Booking is already confirmed",
        booking: { id: booking.id, status: booking.status },
      });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot confirm a cancelled booking" },
        { status: 400 }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot confirm a completed booking" },
        { status: 400 }
      );
    }

    // Update booking status to confirmed
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "confirmed",
      },
      include: {
        tenant: true,
        contact: true,
      },
    });

    // Apply booking status tag
    await applyBookingStatusTag(prisma, booking.id, booking.tenantId, "confirmed", { tenant: booking.tenant });

    console.log("[booking/confirm] Booking confirmed:", booking.id);

    // Send booking confirmed email
    try {
      await sendSystemEmail({
        tenantId: booking.tenantId,
        templateKey: "booking_confirmed",
        to: booking.contact.email,
        booking: updatedBooking,
        contact: booking.contact,
      });
    } catch (emailError) {
      console.error("[booking/confirm] Failed to send confirmation email:", emailError);
    }

    // Trigger booking_confirmed workflow
    triggerWorkflows("booking_confirmed", {
      tenant: booking.tenant,
      booking: updatedBooking,
      contact: booking.contact,
    }).catch((err) => {
      console.error("[booking/confirm] Error triggering workflow:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Booking confirmed successfully",
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/public/booking/[token]/confirm] Error:", error);
    return NextResponse.json(
      { error: "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
