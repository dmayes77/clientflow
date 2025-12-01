import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/invoice/[id] - Get invoice for public viewing
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            businessName: true,
            name: true,
            email: true,
            businessAddress: true,
            businessCity: true,
            businessState: true,
            businessZip: true,
            businessPhone: true,
            stripeOnboardingComplete: true,
            stripeAccountId: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Mark as viewed if not already
    if (invoice.status === "sent" && !invoice.viewedAt) {
      await prisma.invoice.update({
        where: { id },
        data: {
          status: "viewed",
          viewedAt: new Date(),
        },
      });
      invoice.status = "viewed";
      invoice.viewedAt = new Date();
    }

    // Don't expose sensitive tenant info
    const sanitizedInvoice = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      viewedAt: invoice.viewedAt,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      currency: invoice.currency,
      lineItems: invoice.lineItems,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress,
      notes: invoice.notes,
      terms: invoice.terms,
      tenant: {
        businessName: invoice.tenant.businessName,
        name: invoice.tenant.name,
        email: invoice.tenant.email,
        businessAddress: invoice.tenant.businessAddress,
        businessCity: invoice.tenant.businessCity,
        businessState: invoice.tenant.businessState,
        businessZip: invoice.tenant.businessZip,
        businessPhone: invoice.tenant.businessPhone,
        stripeOnboardingComplete: invoice.tenant.stripeOnboardingComplete,
      },
    };

    return NextResponse.json(sanitizedInvoice);
  } catch (error) {
    console.error("Error fetching public invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}
