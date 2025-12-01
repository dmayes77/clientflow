import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createSmartErrorResponse } from "@/lib/errors";
import { testWebhook } from "@/lib/webhooks";
import { z } from "zod";

const updateWebhookSchema = z.object({
  url: z.string().url("Invalid URL").optional(),
  events: z.array(z.string()).min(1, "At least one event is required").optional(),
  active: z.boolean().optional(),
  description: z.string().max(500, "Description is too long").optional().nullable(),
});

// GET /api/webhooks/[id] - Get webhook details with recent deliveries
export async function GET(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
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
          take: 20,
          select: {
            id: true,
            event: true,
            statusCode: true,
            success: true,
            attempts: true,
            createdAt: true,
          },
        },
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Don't expose the full secret
    const { secret, ...webhookWithoutSecret } = webhook;

    return NextResponse.json({
      webhook: {
        ...webhookWithoutSecret,
        secretPreview: `${secret.substring(0, 12)}...`,
      },
    });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

// POST /api/webhooks/[id] - Test a webhook
export async function POST(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 10, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;

    const webhook = await prisma.webhook.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const result = await testWebhook(webhook.url, webhook.secret);

    return NextResponse.json({
      ...result,
      testedAt: new Date().toISOString(),
    });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

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

    const webhookId = params.id;
    const body = await request.json();

    // Validate request body
    const result = updateWebhookSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    // Verify webhook belongs to this tenant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        tenantId: tenant.id,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url: result.data.url,
        events: result.data.events,
        active: result.data.active !== undefined ? result.data.active : webhook.active,
        description: result.data.description,
      },
      select: {
        id: true,
        url: true,
        events: true,
        active: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updatedWebhook);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

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

    const webhookId = params.id;

    // Verify webhook belongs to this tenant
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        tenantId: tenant.id,
      },
    });

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
