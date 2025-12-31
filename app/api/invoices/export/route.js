import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * Export invoices to CSV
 * GET /api/invoices/export
 */
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Parse query params for filtering
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build where clause
    const where = {
      tenantId: tenant.id,
    };

    if (statusFilter && statusFilter !== "all") {
      where.status = statusFilter;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    // Fetch invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contact: {
          select: { name: true, email: true },
        },
        booking: {
          select: {
            service: { select: { name: true } },
            package: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const headers = [
      "Invoice Number",
      "Date",
      "Due Date",
      "Client Name",
      "Client Email",
      "Service/Package",
      "Subtotal",
      "Discount",
      "Tax",
      "Total",
      "Amount Paid",
      "Balance Due",
      "Status",
      "Deposit %",
      "Deposit Paid",
    ];

    const rows = invoices.map((invoice) => {
      const serviceName =
        invoice.booking?.service?.name ||
        invoice.booking?.package?.name ||
        "N/A";

      return [
        invoice.invoiceNumber,
        new Date(invoice.createdAt).toISOString().split("T")[0],
        new Date(invoice.dueDate).toISOString().split("T")[0],
        `"${(invoice.contactName || "").replace(/"/g, '""')}"`,
        `"${(invoice.contactEmail || "").replace(/"/g, '""')}"`,
        `"${serviceName.replace(/"/g, '""')}"`,
        (invoice.subtotal / 100).toFixed(2),
        (invoice.discountAmount / 100).toFixed(2),
        (invoice.taxAmount / 100).toFixed(2),
        (invoice.total / 100).toFixed(2),
        ((invoice.amountPaid || 0) / 100).toFixed(2),
        ((invoice.balanceDue || invoice.total) / 100).toFixed(2),
        invoice.status,
        invoice.depositPercent || "",
        invoice.depositPaidAt ? "Yes" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="invoices-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting invoices:", error);
    return NextResponse.json(
      { error: "Failed to export invoices" },
      { status: 500 }
    );
  }
}
