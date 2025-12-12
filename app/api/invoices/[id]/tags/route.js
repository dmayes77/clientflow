import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/invoices/[id]/tags - Get all tags for an invoice
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoiceTags = await prisma.invoiceTag.findMany({
      where: { invoiceId: id },
      include: { tag: true },
    });

    return NextResponse.json(invoiceTags.map((it) => it.tag));
  } catch (error) {
    console.error("Error fetching invoice tags:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices/[id]/tags - Add a tag to an invoice
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

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant and is appropriate type
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        tenantId: tenant.id,
        type: { in: ["general", "invoice"] },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found or not applicable to invoices" }, { status: 404 });
    }

    // Check if tag already exists on invoice
    const existingTag = await prisma.invoiceTag.findFirst({
      where: { invoiceId: id, tagId },
    });

    if (existingTag) {
      return NextResponse.json({ error: "Tag already added to invoice" }, { status: 400 });
    }

    // Add the tag
    const invoiceTag = await prisma.invoiceTag.create({
      data: { invoiceId: id, tagId },
      include: { tag: true },
    });

    // Trigger invoice_tag_added workflows (async, don't wait)
    triggerWorkflows("invoice_tag_added", {
      tenant,
      invoice,
      tag,
      client: invoice.contact,
    }).catch((err) => {
      console.error("Error triggering invoice_tag_added workflows:", err);
    });

    return NextResponse.json(invoiceTag.tag, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]/tags - Remove a tag from an invoice
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

    // Verify invoice belongs to tenant
    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId: tenant.id },
      include: { contact: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Verify tag belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: { id: tagId, tenantId: tenant.id },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Remove the tag
    await prisma.invoiceTag.deleteMany({
      where: { invoiceId: id, tagId },
    });

    // Trigger invoice_tag_removed workflows (async, don't wait)
    triggerWorkflows("invoice_tag_removed", {
      tenant,
      invoice,
      tag,
      client: invoice.contact,
    }).catch((err) => {
      console.error("Error triggering invoice_tag_removed workflows:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing tag from invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
