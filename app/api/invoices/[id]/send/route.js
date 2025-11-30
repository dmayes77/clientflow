import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createSmartErrorResponse } from "@/lib/errors";
import { triggerWebhook } from "@/lib/webhooks";
import { resend } from "@/lib/resend";
import { InvoiceEmail } from "@/emails/invoice";

export async function POST(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 20, windowMs: 60000 });
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
        tenant: {
          select: {
            businessName: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Don't send cancelled or already paid invoices
    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot send a cancelled invoice" },
        { status: 400 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice has already been paid" },
        { status: 400 }
      );
    }

    const businessName = invoice.tenant.businessName || invoice.tenant.name || "ClientFlow";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const viewUrl = `${baseUrl}/invoice/${invoice.id}`;
    const pdfUrl = `${baseUrl}/api/invoices/${invoice.id}/pdf`;

    // Send the email
    const { data, error } = await resend.emails.send({
      from: `${businessName} <invoices@${process.env.RESEND_DOMAIN || "clientflow.com"}>`,
      to: [invoice.clientEmail],
      subject: `Invoice ${invoice.invoiceNumber} from ${businessName}`,
      react: InvoiceEmail({
        invoice,
        businessName,
        viewUrl,
        pdfUrl,
      }),
    });

    if (error) {
      console.error("Email send error:", error);
      return NextResponse.json(
        { error: "Failed to send invoice email", details: error.message },
        { status: 500 }
      );
    }

    // Update invoice status to sent
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: invoice.status === "draft" ? "sent" : invoice.status,
        sentAt: new Date(),
      },
    });

    // Trigger webhook
    triggerWebhook(tenantId, "invoice.sent", updatedInvoice);

    return NextResponse.json({
      success: true,
      message: "Invoice sent successfully",
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Send invoice error:", error);
    return createSmartErrorResponse(error);
  }
}
