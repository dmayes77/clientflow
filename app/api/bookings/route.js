import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createBookingSchema, validateRequest } from "@/lib/validations";
import { createSmartErrorResponse } from "@/lib/errors";
import { triggerWebhook } from "@/lib/webhooks";

export async function GET(request) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();
    const apiKey = request.headers.get("X-API-Key");

    let tenantId;

    if (apiKey) {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { tenant: true },
      });

      if (!apiKeyRecord) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      tenantId = apiKeyRecord.tenantId;

      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      });
    } else if (userId && orgId) {
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      tenantId = tenant.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { tenantId },
      include: {
        client: true,
        service: true,
        invoice: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function POST(request) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const apiKey = request.headers.get("X-API-Key");
    const { userId, orgId } = await auth();

    let tenantId;

    if (apiKey) {
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
      });

      if (!apiKeyRecord) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
      }

      tenantId = apiKeyRecord.tenantId;

      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      });
    } else if (userId && orgId) {
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      tenantId = tenant.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, createBookingSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    let client = await prisma.client.findFirst({
      where: {
        tenantId,
        email: validation.data.clientEmail,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          tenantId,
          name: validation.data.clientName,
          email: validation.data.clientEmail,
          phone: validation.data.clientPhone || null,
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        clientId: client.id,
        serviceId: validation.data.serviceId,
        scheduledAt: new Date(validation.data.date || validation.data.scheduledAt),
        status: validation.data.status || "inquiry",
        notes: validation.data.notes || null,
        totalPrice: validation.data.amount || validation.data.totalPrice || 0,
        duration: validation.data.duration || 60,
      },
      include: {
        client: true,
        service: true,
      },
    });

    // Trigger webhook
    triggerWebhook(tenantId, "booking.created", booking);

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
