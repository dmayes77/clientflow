import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// POST /api/bookings/[id]/packages - Add a package to a booking
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { packageId, quantity = 1 } = body;

    if (!packageId) {
      return NextResponse.json({ error: "packageId is required" }, { status: 400 });
    }

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify package belongs to tenant
    const pkg = await prisma.package.findFirst({
      where: { id: packageId, tenantId: tenant.id },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    // Check if package already exists on booking
    const existing = await prisma.bookingPackage.findFirst({
      where: { bookingId: id, packageId },
    });

    if (existing) {
      return NextResponse.json({ error: "Package already added to booking" }, { status: 400 });
    }

    // Add the package
    const bookingPackage = await prisma.bookingPackage.create({
      data: { bookingId: id, packageId, quantity },
      include: { package: true },
    });

    return NextResponse.json({
      ...bookingPackage.package,
      quantity: bookingPackage.quantity
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding package to booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/packages - Remove a package from a booking
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const packageId = searchParams.get("packageId");

    if (!packageId) {
      return NextResponse.json({ error: "packageId query parameter is required" }, { status: 400 });
    }

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Remove the package
    await prisma.bookingPackage.deleteMany({
      where: { bookingId: id, packageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing package from booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
