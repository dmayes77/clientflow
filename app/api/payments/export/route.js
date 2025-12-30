import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * Export payments to CSV
 * GET /api/payments/export
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

    // Fetch payments
    const payments = await prisma.payment.findMany({
      where,
      include: {
        contact: {
          select: { name: true, email: true },
        },
        bookings: {
          select: {
            service: { select: { name: true } },
            package: { select: { name: true } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV content
    const headers = [
      "Date",
      "Client Name",
      "Client Email",
      "Service",
      "Amount",
      "Status",
      "Card Brand",
      "Card Last 4",
      "Deposit Amount",
      "Refunded Amount",
      "Stripe Payment Intent ID",
    ];

    const rows = payments.map((payment) => {
      const serviceName = payment.bookings?.[0]?.service?.name ||
                          payment.bookings?.[0]?.package?.name ||
                          "N/A";

      return [
        new Date(payment.createdAt).toISOString().split("T")[0],
        `"${(payment.clientName || "").replace(/"/g, '""')}"`,
        `"${(payment.clientEmail || "").replace(/"/g, '""')}"`,
        `"${serviceName.replace(/"/g, '""')}"`,
        (payment.amount / 100).toFixed(2),
        payment.status,
        payment.cardBrand || "",
        payment.cardLast4 || "",
        payment.depositAmount ? (payment.depositAmount / 100).toFixed(2) : "",
        payment.refundedAmount ? (payment.refundedAmount / 100).toFixed(2) : "",
        payment.stripePaymentIntentId,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="payments-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting payments:", error);
    return NextResponse.json(
      { error: "Failed to export payments" },
      { status: 500 }
    );
  }
}
