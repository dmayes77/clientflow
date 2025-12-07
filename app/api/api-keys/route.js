import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import crypto from "crypto";

// GET /api/api-keys - Get all API keys for tenant
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        key: true,
        lastUsed: true,
        createdAt: true,
      },
    });

    // Mask the API keys for security (show only last 8 characters)
    const maskedKeys = apiKeys.map((apiKey) => ({
      ...apiKey,
      key: `cf_...${apiKey.key.slice(-8)}`,
      fullKey: undefined, // Never expose full key in list
    }));

    return NextResponse.json(maskedKeys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/api-keys - Generate a new API key
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name } = body;

    // Generate a secure API key
    const randomBytes = crypto.randomBytes(32).toString("hex");
    const apiKey = `cf_${randomBytes}`;

    const newApiKey = await prisma.apiKey.create({
      data: {
        tenantId: tenant.id,
        name: name || "API Key",
        key: apiKey,
      },
    });

    // Return the full key only on creation (this is the only time it's shown)
    return NextResponse.json(
      {
        id: newApiKey.id,
        name: newApiKey.name,
        key: apiKey, // Full key shown only on creation
        createdAt: newApiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/api-keys - Delete an API key
export async function DELETE(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "API key ID is required" }, { status: 400 });
    }

    // Verify the API key belongs to this tenant
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
