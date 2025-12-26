import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPaymentReminder } from "@/lib/email";

/**
 * Cron job to send automated payment reminders
 * Runs daily to check for overdue invoices and send appropriate reminders
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
    const results = {
      gentle: [],
      urgent: [],
      final: [],
      errors: [],
    };

    // Find all overdue invoices that need reminders
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: "overdue",
        balanceDue: { gt: 0 },
        OR: [
          { paidAt: null },
          { balanceDue: { gt: 0 } },
        ],
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    console.log(`[Cron] Found ${overdueInvoices.length} overdue invoices`);

    // Process each invoice
    for (const invoice of overdueInvoices) {
      try {
        // Skip if contact has no email
        if (!invoice.contact?.email) {
          console.log(`[Cron] Skipping invoice ${invoice.invoiceNumber} - no contact email`);
          continue;
        }

        // Calculate days overdue
        const daysOverdue = Math.floor(
          (now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
        );

        // Determine if reminder should be sent based on days overdue
        // Send reminders at: 1 day (gentle), 3 days (urgent), 7 days (final), then every 7 days
        const shouldSendReminder =
          daysOverdue === 1 ||
          daysOverdue === 3 ||
          daysOverdue === 7 ||
          (daysOverdue > 7 && daysOverdue % 7 === 0);

        if (!shouldSendReminder) {
          continue;
        }

        // Send reminder email
        const result = await sendPaymentReminder({
          to: invoice.contact.email,
          contactName: invoice.contact.name || invoice.contact.email,
          businessName: invoice.tenant.businessName || "Your Business",
          invoiceNumber: invoice.invoiceNumber,
          total: invoice.total,
          balanceDue: invoice.balanceDue,
          currency: invoice.currency || "usd",
          dueDate: invoice.dueDate,
          daysOverdue,
          viewUrl: null, // TODO: Add public invoice view URL when customer portal is ready
          payUrl: null, // TODO: Add payment URL when payment portal is ready
        });

        if (result.success) {
          const category = daysOverdue >= 7 ? "final" : daysOverdue >= 3 ? "urgent" : "gentle";
          results[category].push({
            invoiceNumber: invoice.invoiceNumber,
            contactEmail: invoice.contact.email,
            daysOverdue,
          });

          // Update invoice metadata to track last reminder sent
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              metadata: {
                ...invoice.metadata,
                lastReminderSent: now.toISOString(),
                reminderCount: (invoice.metadata?.reminderCount || 0) + 1,
              },
            },
          });

          console.log(
            `[Cron] Sent ${category} reminder for invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`
          );
        } else {
          results.errors.push({
            invoiceNumber: invoice.invoiceNumber,
            error: result.error,
          });
        }
      } catch (error) {
        console.error(
          `[Cron] Error processing invoice ${invoice.invoiceNumber}:`,
          error
        );
        results.errors.push({
          invoiceNumber: invoice.invoiceNumber,
          error: error.message,
        });
      }
    }

    const totalSent =
      results.gentle.length + results.urgent.length + results.final.length;

    return NextResponse.json({
      success: true,
      message: `Sent ${totalSent} payment reminder(s)`,
      details: {
        gentle: results.gentle.length,
        urgent: results.urgent.length,
        final: results.final.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    console.error("[Cron] Error in send-payment-reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to send payment reminders",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
