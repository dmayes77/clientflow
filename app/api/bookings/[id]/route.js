import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateBookingSchema, validateRequest } from "@/lib/validations";
import { createSmartErrorResponse } from "@/lib/errors";
import { sendBookingCancellation, sendBookingRescheduled } from "@/lib/email";
import { dispatchBookingCancelled, dispatchBookingRescheduled } from "@/lib/webhooks";

export async function PATCH(request, { params }) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        slug: true,
        email: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const { id } = await params;

    // Validate request body
    const validation = validateRequest(body, updateBookingSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        client: true,
        service: true,
        package: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Track what's changing for email notifications
    const isBeingCancelled = validation.data.status === "cancelled" && booking.status !== "cancelled";
    const isBeingRescheduled = validation.data.date &&
      new Date(validation.data.date).getTime() !== booking.scheduledAt.getTime();

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: validation.data.status,
        serviceId: validation.data.serviceId,
        scheduledAt: validation.data.date ? new Date(validation.data.date) : undefined,
        notes: validation.data.notes,
        totalPrice: validation.data.amount,
      },
      include: {
        client: true,
        service: true,
        package: true,
      },
    });

    const fullAddress = [
      tenant.businessAddress,
      tenant.businessCity,
      tenant.businessState,
      tenant.businessZip,
    ]
      .filter(Boolean)
      .join(", ");

    const serviceName = updatedBooking.service?.name || updatedBooking.package?.name;

    // Send cancellation email
    if (isBeingCancelled && booking.client?.email) {
      sendBookingCancellation({
        to: booking.client.email,
        businessName: tenant.businessName,
        businessPhone: tenant.businessPhone,
        businessEmail: tenant.email,
        clientName: booking.client.name,
        serviceName,
        scheduledAt: booking.scheduledAt,
        cancelledBy: "business",
        rebookUrl: `https://getclientflow.app/book/${tenant.slug || tenant.id}`,
      }).catch((err) => console.error("Failed to send cancellation email:", err));

      // Dispatch webhook for booking cancellation
      dispatchBookingCancelled(tenant.id, updatedBooking, "business").catch((err) =>
        console.error("Failed to dispatch booking.cancelled webhook:", err)
      );
    }

    // Send rescheduled email
    if (isBeingRescheduled && !isBeingCancelled && booking.client?.email) {
      sendBookingRescheduled({
        to: booking.client.email,
        businessName: tenant.businessName,
        businessPhone: tenant.businessPhone,
        businessEmail: tenant.email,
        businessAddress: fullAddress || null,
        clientName: booking.client.name,
        serviceName,
        previousScheduledAt: booking.scheduledAt,
        newScheduledAt: updatedBooking.scheduledAt,
        duration: updatedBooking.duration,
        rescheduledBy: "business",
        bookingId: updatedBooking.id.slice(-8).toUpperCase(),
      }).catch((err) => console.error("Failed to send rescheduled email:", err));

      // Dispatch webhook for booking rescheduled
      dispatchBookingRescheduled(tenant.id, updatedBooking, booking.scheduledAt).catch((err) =>
        console.error("Failed to dispatch booking.rescheduled webhook:", err)
      );
    }

    return NextResponse.json(updatedBooking);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  try {
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

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
