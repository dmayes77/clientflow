import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { InvoiceDocument } from "@/lib/invoice-pdf";

// GET /api/invoices/[id]/pdf - Generate and download invoice PDF
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    let invoice;
    let tenant;

    if (isPublic) {
      // Public access - find invoice directly
      invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          contact: true,
          tenant: {
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
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }

      tenant = invoice.tenant;
    } else {
      // Authenticated access
      const auth = await getAuthenticatedTenant(request);

      if (!auth.tenant) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
      }

      tenant = auth.tenant;

      invoice = await prisma.invoice.findFirst({
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
        },
      });

      tenant = fullTenant;
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <InvoiceDocument invoice={invoice} tenant={tenant} />
    );

    // Return PDF as downloadable file
    const filename = `invoice-${invoice.invoiceNumber}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
