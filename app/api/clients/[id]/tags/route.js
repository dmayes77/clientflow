import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/clients/[id]/tags - Get all tags for a client
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const clientTags = await prisma.clientTag.findMany({
      where: { clientId: id },
      include: { tag: true },
    });

    return NextResponse.json(clientTags.map((ct) => ct.tag));
  } catch (error) {
    console.error("Error fetching client tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients/[id]/tags - Add a tag to a client
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if tag already exists on client
    const existingTag = await prisma.clientTag.findFirst({
      where: { clientId: id, tagId },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag already added to client" }, { status: 400 });
    }

    // Add the tag
    const clientTag = await prisma.clientTag.create({
      data: { clientId: id, tagId },
      include: { tag: true },
    });

    // Trigger tag_added workflows (async, don't wait)
    triggerWorkflows("tag_added", {
      tenant,
      client,
      tag,
    }).catch((err) => {
      console.error("Error triggering tag_added workflows:", err);
    });

    return NextResponse.json(clientTag.tag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to client:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients/[id]/tags - Remove a tag from a client
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId query parameter is required" }, { status: 400 });
    }

    // Verify client belongs to tenant
    const client = await prisma.client.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Remove the tag
    await prisma.clientTag.deleteMany({
      where: { clientId: id, tagId },
    });

    // Trigger tag_removed workflows (async, don't wait)
    triggerWorkflows("tag_removed", {
      tenant,
      client,
      tag,
    }).catch((err) => {
      console.error("Error triggering tag_removed workflows:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from client:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
