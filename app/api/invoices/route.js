import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createInvoiceSchema, validateRequest } from "@/lib/validations";
import { createSmartErrorResponse } from "@/lib/errors";
import { triggerWebhook } from "@/lib/webhooks";

// Generate unique invoice number for tenant
async function generateInvoiceNumber(tenantId) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  // Find the highest invoice number for this tenant and year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      tenantId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
  });

  if (!lastInvoice) {
    return `${prefix}0001`;
  }

  // Extract number and increment
  const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10);
  const nextNumber = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${nextNumber}`;
}

// Calculate invoice totals from line items
function calculateTotals(lineItems, taxRate = 0) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export async function GET(request) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();
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

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const where = { tenantId };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        booking: {
          include: {
            service: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}

export async function POST(request) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const apiKey = request.headers.get("X-API-Key");
    const { userId, orgId } = await auth();

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

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(body, createInvoiceSchema);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Check if booking already has an invoice
    if (validation.data.bookingId) {
      const existingInvoice = await prisma.invoice.findUnique({
        where: { bookingId: validation.data.bookingId },
      });
      if (existingInvoice) {
        return NextResponse.json(
          { error: "This booking already has an invoice" },
          { status: 400 }
        );
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(tenantId);

    // Calculate totals
    const taxRate = validation.data.taxRate || 0;
    const { subtotal, taxAmount, total } = calculateTotals(validation.data.lineItems, taxRate);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        clientId: validation.data.clientId || null,
        bookingId: validation.data.bookingId || null,
        invoiceNumber,
        status: validation.data.status || "draft",
        dueDate: new Date(validation.data.dueDate),
        subtotal,
        taxRate,
        taxAmount,
        total,
        lineItems: validation.data.lineItems,
        clientName: validation.data.clientName,
        clientEmail: validation.data.clientEmail,
        clientAddress: validation.data.clientAddress || null,
        notes: validation.data.notes || null,
        terms: validation.data.terms || null,
      },
      include: {
        client: true,
        booking: true,
      },
    });

    // Trigger webhook
    triggerWebhook(tenantId, "invoice.created", invoice);

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return createSmartErrorResponse(error);
  }
}
