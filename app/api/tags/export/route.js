import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthenticatedTenant } from "@/lib/auth";

const prisma = new PrismaClient();

/**
 * Export all tags to CSV
 * GET /api/tags/export
 */
export async function GET(request) {
  try {
    // Authenticate
    const tenant = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all tags for this tenant with usage counts
    const tags = await prisma.tag.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
        _count: {
          select: {
            contacts: true,
            invoices: true,
            bookings: true,
            payments: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Generate CSV content
    const headers = [
      "Name",
      "Color",
      "Type",
      "Description",
      "System Tag",
      "Contacts",
      "Invoices",
      "Bookings",
      "Payments",
      "Total Usage",
    ];

    const rows = tags.map((tag) => {
      const totalUsage =
        tag._count.contacts +
        tag._count.invoices +
        tag._count.bookings +
        tag._count.payments;

      return [
        `"${tag.name.replace(/"/g, '""')}"`, // Escape quotes
        tag.color,
        tag.type,
        tag.description ? `"${tag.description.replace(/"/g, '""')}"` : "",
        tag.isSystem ? "Yes" : "No",
        tag._count.contacts,
        tag._count.invoices,
        tag._count.bookings,
        tag._count.payments,
        totalUsage,
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="tags-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting tags:", error);
    return NextResponse.json(
      { error: "Failed to export tags" },
      { status: 500 }
    );
  }
}
