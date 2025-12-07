import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/webhooks/[id] - Get a single webhook with delivery history
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error fetching webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/webhooks/[id] - Update a webhook
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();

    // Check if webhook exists and belongs to tenant
    const existing = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const { url, events, description, active } = body;

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
      }
    }

    // Validate events if provided
    if (events !== undefined && (!Array.isArray(events) || events.length === 0)) {
      return NextResponse.json(
        { error: "At least one event is required" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...(url !== undefined && { url }),
        ...(events !== undefined && { events }),
        ...(description !== undefined && { description }),
        ...(active !== undefined && { active }),
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/webhooks/[id] - Delete a webhook
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Check if webhook exists and belongs to tenant
    const existing = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
