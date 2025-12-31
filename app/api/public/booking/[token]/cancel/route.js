import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyBookingStatusTag } from "@/lib/system-tags";
import { triggerWorkflows } from "@/lib/workflow-executor";

/**
 * POST /api/public/booking/[token]/cancel
 * Cancel a booking via confirmation token (public endpoint)
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Parse request body for optional reason
    let reason = null;
    try {
      const body = await request.json();
      reason = body.reason || null;
    } catch {
      // Body is optional
    }

    // Find booking by confirmation token
    const booking = await prisma.booking.findUnique({
      where: { confirmationToken: token },
      include: {
        tenant: true,
        contact: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json({
        success: true,
        message: "Booking is already cancelled",
        booking: { id: booking.id, status: booking.status },
      });
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot cancel a completed booking" },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "cancelled",
        notes: reason
          ? `${booking.notes ? booking.notes + "\n\n" : ""}Cancellation reason: ${reason}`
          : booking.notes,
      },
      include: {
        tenant: true,
        contact: true,
      },
    });

    // Apply booking status tag
    await applyBookingStatusTag(prisma, booking.id, booking.tenantId, "cancelled", { tenant: booking.tenant });

    console.log("[booking/cancel] Booking cancelled:", booking.id);

    // Trigger booking_cancelled workflow
    triggerWorkflows("booking_cancelled", {
      tenant: booking.tenant,
      booking: updatedBooking,
      contact: booking.contact,
      reason,
    }).catch((err) => {
      console.error("[booking/cancel] Error triggering workflow:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status,
      },
    });
  } catch (error) {
    console.error("[POST /api/public/booking/[token]/cancel] Error:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
