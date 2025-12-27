import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { isStatusTag, getStatusTagsForType, getStatusTag } from "@/lib/tag-status";

// GET /api/contacts/[id]/tags - Get all tags for a contact
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const contactTags = await prisma.contactTag.findMany({
      where: { contactId: id },
      include: { tag: true },
    });

    return NextResponse.json(contactTags.map((ct) => ct.tag));
  } catch (error) {
    console.error("Error fetching contact tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts/[id]/tags - Add a tag to a contact
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

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check if tag already exists on contact
    const existingTag = await prisma.contactTag.findFirst({
      where: { contactId: id, tagId },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag already added to contact" }, { status: 400 });
    }

    // Check if this is a status tag
    const isStatus = isStatusTag(tag.name, "contact");

    // Get current status tag before making changes (for workflow detection)
    const contactWithTags = await prisma.contact.findUnique({
      where: { id },
      include: {
        tags: {
          include: { tag: true },
          },
        },
      });
    const previousStatusTag = getStatusTag(contactWithTags, "contact");

    if (isStatus) {
      // This is a status tag - remove any existing status tags first
      const statusTagNames = getStatusTagsForType("contact");
      const allStatusTags = await prisma.tag.findMany({
        where: {
          tenantId: tenant.id,
          name: { in: statusTagNames },
        },
      });
      const statusTagIds = allStatusTags.map((t) => t.id);

      // Remove all existing status tags
      await prisma.contactTag.deleteMany({
        where: {
          contactId: id,
          tagId: { in: statusTagIds },
        },
      });
    }

    // Add the new tag
    const contactTag = await prisma.contactTag.create({
      data: { contactId: id, tagId },
      include: { tag: true },
    });

    // Trigger tag_added workflows (async, don't wait)
    triggerWorkflows("tag_added", {
      tenant,
      contact,
      tag,
    }).catch((err) => {
      console.error("Error triggering tag_added workflows:", err);
    });

    // Check for contact conversion (Lead → Client)
    if (
      isStatus &&
      previousStatusTag?.name === "Lead" &&
      tag.name === "Client"
    ) {
      // Trigger client_converted workflow (async, don't wait)
      triggerWorkflows("client_converted", {
        tenant,
        contact: { ...contact, id },
      }).catch((err) => {
        console.error("Error triggering client_converted workflows:", err);
      });
    }

    return NextResponse.json(contactTag.tag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]/tags - Remove a tag from a contact
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

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Remove the tag
    await prisma.contactTag.deleteMany({
      where: { contactId: id, tagId },
    });

    // Trigger tag_removed workflows (async, don't wait)
    triggerWorkflows("tag_removed", {
      tenant,
      contact,
      tag,
    }).catch((err) => {
      console.error("Error triggering tag_removed workflows:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
