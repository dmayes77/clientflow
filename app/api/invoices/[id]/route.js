import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { updateInvoiceSchema, validateRequest } from "@/lib/validations";
import { createSmartErrorResponse } from "@/lib/errors";
import { triggerWebhook } from "@/lib/webhooks";

// Calculate invoice totals from line items
function calculateTotals(lineItems, taxRate = 0) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export async function GET(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { id } = await params;
    const { userId, orgId } = await auth();
    const apiKey = request.headers.get("X-API-Key");

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

    const invoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        client: true,
        booking: {
          include: {
            service: true,
          },
        },
        tenant: {
          select: {
            businessName: true,
            businessAddress: true,
            businessCity: true,
            businessState: true,
            businessZip: true,
            businessPhone: true,
            email: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function PATCH(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { id } = await params;
    const { userId, orgId } = await auth();
    const apiKey = request.headers.get("X-API-Key");

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

    // Check if invoice exists and belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, updateInvoiceSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = { ...validation.data };

    // If line items are being updated, recalculate totals
    if (validation.data.lineItems) {
      const taxRate = validation.data.taxRate ?? existingInvoice.taxRate;
      const { subtotal, taxAmount, total } = calculateTotals(validation.data.lineItems, taxRate);
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    } else if (validation.data.taxRate !== undefined) {
      // If only tax rate changed, recalculate with existing line items
      const { subtotal, taxAmount, total } = calculateTotals(
        existingInvoice.lineItems,
        validation.data.taxRate
      );
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }

    // Handle date conversion
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Track status changes
    if (validation.data.status === "paid" && existingInvoice.status !== "paid") {
      updateData.paidAt = new Date();
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        booking: true,
      },
    });

    // Trigger webhook
    triggerWebhook(tenantId, "invoice.updated", invoice);

    return NextResponse.json(invoice);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function DELETE(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { id } = await params;
    const { userId, orgId } = await auth();
    const apiKey = request.headers.get("X-API-Key");

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

    // Check if invoice exists and belongs to tenant
    const existingInvoice = await prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Don't allow deleting paid invoices
    if (existingInvoice.status === "paid") {
      return NextResponse.json(
        { error: "Cannot delete a paid invoice" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    // Trigger webhook
    triggerWebhook(tenantId, "invoice.deleted", { id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
