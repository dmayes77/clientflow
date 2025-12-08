import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateClientSchema, validateRequest } from "@/lib/validations";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/clients/[id] - Get a single client with bookings and stats
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const [client, allTags] = await Promise.all([
      prisma.client.findFirst({
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
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.tag.findMany({
        where: { tenantId: tenant.id },
        orderBy: { name: "asc" },
      }),
    ]);

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Transform tags to simpler format
    const clientTags = client.tags.map((ct) => ct.tag);
    const clientWithTags = { ...client, tags: clientTags };

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

    return NextResponse.json({ client: clientWithTags, stats, allTags });
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

    // Check if client was converted from lead/prospect to active
    const wasLead = ["lead", "prospect"].includes(existingClient.status);
    const isNowActive = data.status === "active";

    if (wasLead && isNowActive) {
      // Trigger client_converted workflows (async, don't wait)
      triggerWorkflows("client_converted", {
        tenant,
        client,
      }).catch((err) => {
        console.error("Error triggering client_converted workflows:", err);
      });
    }

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
      include: {
        bookings: {
          where: { status: "completed" },
          select: { id: true },
        },
        invoices: {
          where: { status: "paid" },
          select: { id: true },
        },
      },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Prevent deletion if contact has completed bookings or paid invoices
    const hasCompletedBookings = existingClient.bookings.length > 0;
    const hasPaidInvoices = existingClient.invoices.length > 0;

    if (hasCompletedBookings || hasPaidInvoices) {
      const reasons = [];
      if (hasCompletedBookings) reasons.push(`${existingClient.bookings.length} completed booking(s)`);
      if (hasPaidInvoices) reasons.push(`${existingClient.invoices.length} paid invoice(s)`);

      return NextResponse.json(
        {
          error: `Cannot delete contact with ${reasons.join(" and ")}. Delete incomplete bookings and unpaid invoices first.`,
          hasCompletedBookings,
          hasPaidInvoices,
        },
        { status: 400 }
      );
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
