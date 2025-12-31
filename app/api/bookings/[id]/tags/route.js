import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { isStatusTag, getStatusTagsForType, getStatusTag } from "@/lib/tag-status";

// GET /api/bookings/[id]/tags - Get all tags for a booking
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingTags = await prisma.bookingTag.findMany({
      where: { bookingId: id },
      include: { tag: true },
    });

    return NextResponse.json(bookingTags.map((bt) => bt.tag));
  } catch (error) {
    console.error("Error fetching booking tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings/[id]/tags - Add a tag to a booking
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

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true, service: true, package: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant and is appropriate type
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        tenantId: tenant.id,
        type: { in: ["general", "booking"] },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found or not applicable to bookings" }, { status: 404 });
    }

    // Check if tag already exists on booking
    const existingTag = await prisma.bookingTag.findFirst({
      where: { bookingId: id, tagId },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag already added to booking" }, { status: 400 });
    }

    // Check if this is a status tag
    const isStatus = isStatusTag(tag.name, "booking");

    if (isStatus) {
      // This is a status tag - remove any existing status tags first
      const statusTagNames = getStatusTagsForType("booking");
      const allStatusTags = await prisma.tag.findMany({
        where: {
          tenantId: tenant.id,
          name: { in: statusTagNames },
        },
      });
      const statusTagIds = allStatusTags.map((t) => t.id);

      // Remove all existing status tags
      await prisma.bookingTag.deleteMany({
        where: {
          bookingId: id,
          tagId: { in: statusTagIds },
        },
      });

      // Also update the booking.status field to keep in sync with tag
      const tagToStatusMap = {
        "Pending": "pending",
        "Scheduled": "scheduled",
        "Confirmed": "confirmed",
        "Completed": "completed",
        "Cancelled": "cancelled",
        "No Show": "no_show",
      };
      const newStatus = tagToStatusMap[tag.name];
      if (newStatus) {
        await prisma.booking.update({
          where: { id },
          data: { status: newStatus },
        });
      }
    }

    // Add the new tag
    const bookingTag = await prisma.bookingTag.create({
      data: { bookingId: id, tagId },
      include: { tag: true },
    });

    // Trigger booking_tag_added workflows (async, don't wait)
    triggerWorkflows("booking_tag_added", {
      tenant,
      booking,
      tag,
      contact: booking.contact,
    }).catch((err) => {
      console.error("Error triggering booking_tag_added workflows:", err);
    });

    return NextResponse.json(bookingTag.tag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/bookings/[id]/tags - Remove a tag from a booking
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

    // Verify booking belongs to tenant
    const booking = await prisma.booking.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Remove the tag
    await prisma.bookingTag.deleteMany({
      where: { bookingId: id, tagId },
    });

    // Trigger booking_tag_removed workflows (async, don't wait)
    triggerWorkflows("booking_tag_removed", {
      tenant,
      booking,
      tag,
      contact: booking.contact,
    }).catch((err) => {
      console.error("Error triggering booking_tag_removed workflows:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
