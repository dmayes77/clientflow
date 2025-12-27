import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { isStatusTag, getStatusTagsForType } from "@/lib/tag-status";

// GET /api/payments/[id]/tags - Get all tags for a payment
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify payment belongs to tenant
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentTags = await prisma.paymentTag.findMany({
      where: { paymentId: id },
      include: { tag: true },
    });

    return NextResponse.json(paymentTags.map((pt) => pt.tag));
  } catch (error) {
    console.error("Error fetching payment tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/payments/[id]/tags - Add a tag to a payment
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

    // Verify payment belongs to tenant
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant and is appropriate type
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        tenantId: tenant.id,
        type: { in: ["general", "payment"] },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found or not applicable to payments" }, { status: 404 });
    }

    // Check if tag already exists on payment
    const existingTag = await prisma.paymentTag.findFirst({
      where: { paymentId: id, tagId },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag already added to payment" }, { status: 400 });
    }

    // Payments don't have status tags like invoices/bookings/contacts do,
    // but we keep the pattern for consistency
    const isStatus = isStatusTag(tag.name, "payment");

    if (isStatus) {
      // If we ever add payment status tags in the future, handle them here
      const statusTagNames = getStatusTagsForType("payment") || [];
      if (statusTagNames.length > 0) {
        const allStatusTags = await prisma.tag.findMany({
          where: {
            tenantId: tenant.id,
            name: { in: statusTagNames },
          },
        });
        const statusTagIds = allStatusTags.map((t) => t.id);

        await prisma.paymentTag.deleteMany({
          where: {
            paymentId: id,
            tagId: { in: statusTagIds },
          },
        });
      }
    }

    // Add the new tag
    const paymentTag = await prisma.paymentTag.create({
      data: { paymentId: id, tagId },
      include: { tag: true },
    });

    // Trigger payment_tag_added workflows (async, don't wait)
    triggerWorkflows("payment_tag_added", {
      tenant,
      payment,
      tag,
      contact: payment.contact,
    }).catch((err) => {
      console.error("Error triggering payment_tag_added workflows:", err);
    });

    return NextResponse.json(paymentTag.tag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/payments/[id]/tags - Remove a tag from a payment
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

    // Verify payment belongs to tenant
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Remove the tag
    await prisma.paymentTag.deleteMany({
      where: { paymentId: id, tagId },
    });

    // Trigger payment_tag_removed workflows (async, don't wait)
    triggerWorkflows("payment_tag_removed", {
      tenant,
      payment,
      tag,
      contact: payment.contact,
    }).catch((err) => {
      console.error("Error triggering payment_tag_removed workflows:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
