import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createInvoiceSchema, validateRequest } from "@/lib/validations";

// Generate invoice number
async function generateInvoiceNumber(tenantId) {
  const count = await prisma.invoice.count({
    where: { tenantId },
  });
  const paddedNumber = String(count + 1).padStart(5, "0");
  return `INV-${paddedNumber}`;
}

// GET /api/invoices - List all invoices
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const statusFilter = searchParams.get("status");

    const where = {
      tenantId: tenant.id,
      ...(clientId && { clientId }),
      ...(statusFilter && { status: statusFilter }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        booking: {
          include: {
            service: true,
            package: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createInvoiceSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Verify client belongs to tenant if provided
    if (data.clientId) {
      const client = await prisma.client.findFirst({
        where: {
          id: data.clientId,
          tenantId: tenant.id,
        },
      });

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }
    }

    // Verify booking belongs to tenant if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: data.bookingId,
          tenantId: tenant.id,
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
    }

    const invoiceNumber = await generateInvoiceNumber(tenant.id);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        clientId: data.clientId,
        bookingId: data.bookingId,
        invoiceNumber,
        status: data.status || "draft",
        dueDate: data.dueDate,
        subtotal: data.subtotal,
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0,
        total: data.total,
        lineItems: data.lineItems,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientAddress: data.clientAddress,
        notes: data.notes,
        terms: data.terms,
      },
      include: {
        client: true,
        booking: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
