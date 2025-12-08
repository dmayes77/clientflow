import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// POST /api/bookings/[id]/services - Add a service to a booking
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { serviceId, quantity = 1 } = body;

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
    }

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify service belongs to tenant
    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId: tenant.id },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if service already exists on booking
    const existing = await prisma.bookingService.findFirst({
      where: { bookingId: id, serviceId },
    });

    if (existing) {
      return NextResponse.json({ error: "Service already added to booking" }, { status: 400 });
    }

    // Add the service
    const bookingService = await prisma.bookingService.create({
      data: { bookingId: id, serviceId, quantity },
      include: { service: true },
    });

    return NextResponse.json({
      ...bookingService.service,
      quantity: bookingService.quantity
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding service to booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/services - Remove a service from a booking
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json({ error: "serviceId query parameter is required" }, { status: 400 });
    }

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Remove the service
    await prisma.bookingService.deleteMany({
      where: { bookingId: id, serviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing service from booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
