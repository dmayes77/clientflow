import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { createSmartErrorResponse } from "@/lib/errors";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF } from "@/lib/invoice-pdf";

export async function GET(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 50, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    let invoice;

    if (isPublic) {
      // Public access - invoice already has an ID that can be looked up
      invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          client: true,
          tenant: {
            select: {
              businessName: true,
              name: true,
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
    } else {
      // Authenticated access
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

      invoice = await prisma.invoice.findFirst({
        where: { id, tenantId },
        include: {
          client: true,
          tenant: {
            select: {
              businessName: true,
              name: true,
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
    }

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(InvoicePDF({ invoice }));

    // Return PDF response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return createSmartErrorResponse(error);
  }
}
