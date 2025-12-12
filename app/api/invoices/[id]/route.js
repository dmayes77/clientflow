import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateInvoiceSchema, validateRequest } from "@/lib/validations";

// GET /api/invoices/[id] - Get a single invoice
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        booking: {
          include: {
            service: true,
            package: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update an invoice
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, updateInvoiceSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Handle status transitions
    const statusUpdates = {};
    if (data.status && data.status !== existingInvoice.status) {
      if (data.status === "sent" && !existingInvoice.sentAt) {
        statusUpdates.sentAt = new Date();
      }
      if (data.status === "paid" && !existingInvoice.paidAt) {
        statusUpdates.paidAt = new Date();
      }
    }

    // Prevent changing deposit once it's been paid
    if (existingInvoice.depositPaidAt && data.depositPercent !== undefined && data.depositPercent !== existingInvoice.depositPercent) {
      return NextResponse.json(
        { error: "Cannot change deposit after it has been paid" },
        { status: 400 }
      );
    }

    // Safely handle deposit percent - use new value if provided, otherwise keep existing
    const total = data.total ?? existingInvoice.total;
    const rawDepositPercent = data.depositPercent !== undefined ? data.depositPercent : existingInvoice.depositPercent;
    // Ensure deposit percent is a valid positive integer or null
    const safeDepositPercent = (rawDepositPercent !== null && rawDepositPercent !== undefined && rawDepositPercent > 0)
      ? rawDepositPercent
      : null;
    const depositAmount = safeDepositPercent ? Math.round(total * (safeDepositPercent / 100)) : null;

    // Ensure depositPercent is explicitly set in data for the update
    const dataWithDeposit = {
      ...data,
      depositPercent: safeDepositPercent,
    };

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...dataWithDeposit,
        ...statusUpdates,
        depositAmount,
      },
      include: {
        contact: true,
        booking: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only allow deleting draft invoices
    if (existingInvoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
