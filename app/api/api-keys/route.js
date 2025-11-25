import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createApiKeySchema, validateRequest } from "@/lib/validations";
import crypto from "crypto";

function generateApiKey() {
  const prefix = "cfk_live";
  const randomBytes = crypto.randomBytes(32).toString("hex");
  return `${prefix}_${randomBytes}`;
}

export async function GET(request) {
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

    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        key: false,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(apiKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  // Apply stricter rate limiting for API key creation: 10 requests per hour
  const rateLimitResult = rateLimit(request, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          clerkOrgId: orgId,
          name: "My Business",
          email: "",
        },
      });
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, createApiKeySchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const apiKey = generateApiKey();

    const newApiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        name: validation.data.name,
        key: apiKey,
      },
    });

    return NextResponse.json({
      id: newApiKey.id,
      name: newApiKey.name,
      key: apiKey,
      createdAt: newApiKey.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
