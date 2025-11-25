import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createServiceSchema, validateRequest } from "@/lib/validations";

export async function GET(request) {
  // Apply rate limiting: 100 requests per minute
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
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
    } else if (orgId) {
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
      });

      if (!tenant) {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }

      tenantId = tenant.id;
    } else {
      return NextResponse.json({ error: "No organization context" }, { status: 400 });
    }

    const services = await prisma.service.findMany({
      where: {
        tenantId,
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
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

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, createServiceSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      const newTenant = await prisma.tenant.create({
        data: {
          clerkOrgId: orgId,
          name: validation.data.tenantName || "My Business",
          email: validation.data.tenantEmail || "",
        },
      });

      const service = await prisma.service.create({
        data: {
          tenantId: newTenant.id,
          name: validation.data.name,
          description: validation.data.description,
          duration: validation.data.duration,
          price: validation.data.price,
          active: validation.data.active !== undefined ? validation.data.active : true,
        },
      });

      return NextResponse.json(service, { status: 201 });
    }

    const service = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name: validation.data.name,
        description: validation.data.description,
        duration: validation.data.duration,
        price: validation.data.price,
        active: validation.data.active !== undefined ? validation.data.active : true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
