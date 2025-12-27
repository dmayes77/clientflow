import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Cron job endpoint to automatically mark invoices as overdue
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 *
 * GET /api/cron/update-overdue-invoices
 *
 * Security: Should be protected by CRON_SECRET in production
 */
export async function GET(request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find all invoices that:
    // 1. Have a due date in the past
    // 2. Are in "sent" or "viewed" status (not draft, paid, or already overdue)
    // 3. Are not fully paid
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        status: {
          in: ["sent", "viewed"],
        },
        OR: [
          { paidAt: null },
          { balanceDue: { gt: 0 } },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        dueDate: true,
        status: true,
        tenantId: true,
      },
    });

    console.log(`[Cron] Found ${overdueInvoices.length} overdue invoices to update`);

    // Update all overdue invoices to "overdue" status
    const updatePromises = overdueInvoices.map((invoice) =>
      prisma.invoice.update({
        where: { id: invoice.id },
        data: { status: "overdue" },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Updated ${overdueInvoices.length} invoices to overdue status`,
      count: overdueInvoices.length,
      invoices: overdueInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        dueDate: inv.dueDate,
        previousStatus: inv.status,
      })),
    });
  } catch (error) {
    console.error("[Cron] Error updating overdue invoices:", error);
    return NextResponse.json(
      { error: "Failed to update overdue invoices", details: error.message },
      { status: 500 }
    );
  }
}
