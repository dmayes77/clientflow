import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { dispatchInvoiceSent } from "@/lib/webhooks";
import { triggerWorkflows } from "@/lib/workflow-executor";

/**
 * POST /api/invoices/[id]/send - Mark invoice as sent and trigger workflow
 *
 * This route:
 * 1. Updates invoice status to "sent"
 * 2. Triggers the "invoice_sent" workflow
 *
 * The workflow handles all actions:
 * - Applying the "Sent" tag
 * - Sending the invoice email
 */
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Get the invoice with contact
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update invoice status to "sent"
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: "sent",
        sentAt: invoice.sentAt || new Date(),
      },
      include: {
        contact: true,
      },
    });

    // Dispatch webhook (non-blocking)
    dispatchInvoiceSent(tenant.id, {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      dueDate: invoice.dueDate,
      status: updatedInvoice.status,
    }).catch((err) => console.error("Failed to dispatch invoice.sent webhook:", err));

    // Trigger invoice_sent workflow (handles tag + email)
    triggerWorkflows("invoice_sent", {
      tenant,
      invoice: updatedInvoice,
      contact: updatedInvoice.contact,
    }).catch((err) => {
      console.error("Error triggering invoice_sent workflow:", err);
    });

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
