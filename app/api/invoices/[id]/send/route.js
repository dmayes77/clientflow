import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { InvoiceDocument } from "@/lib/invoice-pdf";
import { sendInvoiceEmail } from "@/lib/email";
import { dispatchInvoiceSent } from "@/lib/webhooks";

// POST /api/invoices/[id]/send - Send invoice via email
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Get full tenant info for PDF
    const fullTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      select: {
        businessName: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        businessPhone: true,
        email: true,
        logoUrl: true,
        slug: true,
      },
    });

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument invoice={invoice} tenant={fullTenant} />
    );

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";
    const viewUrl = `${baseUrl}/invoice/${invoice.id}`;

    // If invoice has Stripe checkout, use that. Otherwise, create a pay URL
    let payUrl = null;
    if (invoice.stripeCheckoutSessionId) {
      // Existing checkout session
      payUrl = viewUrl; // They can pay from the view page
    } else if (fullTenant.slug) {
      // Create a new checkout URL
      payUrl = `${baseUrl}/pay/${fullTenant.slug}/${invoice.id}`;
    }

    // Send email with PDF attachment
    const emailResult = await sendInvoiceEmail({
      to: invoice.contactEmail,
      contactName: invoice.contactName,
      businessName: fullTenant.businessName,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      viewUrl,
      payUrl,
      pdfAttachment: pdfBuffer,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send invoice email" },
        { status: 500 }
      );
    }

    // Update invoice status to sent
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sentAt: invoice.sentAt || new Date(),
      },
      include: {
        client: true,
      },
    });

    // Dispatch webhook
    dispatchInvoiceSent(tenant.id, {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      contactName: invoice.contactName,
      contactEmail: invoice.contactEmail,
      total: invoice.total,
      dueDate: invoice.dueDate,
      status: updatedInvoice.status,
    }).catch((err) => console.error("Failed to dispatch invoice.sent webhook:", err));

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
