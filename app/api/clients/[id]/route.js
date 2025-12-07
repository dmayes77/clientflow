import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateClientSchema, validateRequest } from "@/lib/validations";

// GET /api/clients/[id] - Get a single client with bookings and stats
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const client = await prisma.client.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        bookings: {
          include: {
            service: { select: { name: true } },
            package: { select: { name: true } },
          },
          orderBy: { scheduledAt: "desc" },
        },
        invoices: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Calculate stats
    const now = new Date();
    const totalBookings = client.bookings.length;
    const completedBookings = client.bookings.filter((b) => b.status === "completed").length;
    const upcomingBookings = client.bookings.filter(
      (b) => new Date(b.scheduledAt) > now && !["completed", "cancelled"].includes(b.status)
    ).length;
    const totalSpent = client.bookings
      .filter((b) => b.paymentStatus === "paid")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const stats = {
      totalBookings,
      completedBookings,
      upcomingBookings,
      totalSpent,
    };

    return NextResponse.json({ client, stats });
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/clients/[id] - Update a client
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updateClientSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    const client = await prisma.client.update({
      where: { id },
      data,
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
