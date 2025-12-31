import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSystemEmail } from "@/lib/send-system-email";
import { format, addHours, subHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";

/**
 * Cron job to send booking reminders
 * Runs hourly to:
 * 1. Create reminder records for bookings happening in 24-48 hours
 * 2. Send pending reminders that are due
 *
 * Schedule: Run every hour
 * Vercel cron config: 0 * * * *
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
      created: [],
      sent: [],
      skipped: [],
      errors: [],
    };

    // =========================================================================
    // STEP 1: Create reminder records for bookings without one
    // =========================================================================

    // Find confirmed/scheduled bookings in the next 48 hours that don't have a reminder
    const in48Hours = addHours(now, 48);

    const bookingsNeedingReminders = await prisma.booking.findMany({
      where: {
        status: { in: ["scheduled", "confirmed"] },
        scheduledAt: {
          gte: now,
          lte: in48Hours,
        },
        reminders: {
          none: {},
        },
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    console.log(`[Cron] Found ${bookingsNeedingReminders.length} bookings needing reminder records`);

    // Create reminder records (send 24 hours before)
    for (const booking of bookingsNeedingReminders) {
      const sendAt = subHours(booking.scheduledAt, 24);

      // Only create if send time is in the future
      if (sendAt > now) {
        try {
          await prisma.bookingReminder.create({
            data: {
              bookingId: booking.id,
              tenantId: booking.tenantId,
              reminderType: "email",
              sendAt,
              status: "pending",
            },
          });
          results.created.push({ bookingId: booking.id, sendAt });
          console.log(`[Cron] Created reminder for booking ${booking.id} to send at ${sendAt}`);
        } catch (error) {
          console.error(`[Cron] Error creating reminder for booking ${booking.id}:`, error);
        }
      }
    }

    // =========================================================================
    // STEP 2: Send pending reminders that are due
    // =========================================================================

    const pendingReminders = await prisma.bookingReminder.findMany({
      where: {
        status: "pending",
        sendAt: { lte: now },
      },
      include: {
        booking: {
          include: {
            contact: true,
            tenant: true,
            service: true,
            package: true,
          },
        },
      },
    });

    console.log(`[Cron] Found ${pendingReminders.length} pending reminders to send`);

    for (const reminder of pendingReminders) {
      const { booking } = reminder;

      try {
        // Skip if booking was cancelled
        if (booking.status === "cancelled") {
          await prisma.bookingReminder.update({
            where: { id: reminder.id },
            data: { status: "skipped", sentAt: now },
          });
          results.skipped.push({ id: reminder.id, reason: "booking cancelled" });
          continue;
        }

        // Skip if contact has no email
        if (!booking.contact?.email) {
          await prisma.bookingReminder.update({
            where: { id: reminder.id },
            data: { status: "skipped", sentAt: now, error: "no contact email" },
          });
          results.skipped.push({ id: reminder.id, reason: "no contact email" });
          continue;
        }

        // Get tenant timezone
        const timezone = booking.tenant.timezone || "America/New_York";
        const zonedDate = toZonedTime(booking.scheduledAt, timezone);

        // Get service name
        const serviceName = booking.service?.name || booking.package?.name || "Service";

        // Build URLs for reschedule/cancel links
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.clientflow.com";
        const rescheduleUrl = booking.confirmationToken
          ? `${baseUrl}/${booking.tenant.slug}/booking/reschedule/${booking.confirmationToken}`
          : null;
        const cancelUrl = booking.confirmationToken
          ? `${baseUrl}/${booking.tenant.slug}/booking/cancel/${booking.confirmationToken}`
          : null;

        // Send reminder email
        await sendSystemEmail(booking.tenantId, "booking_reminder", booking.contact.email, {
          contact: {
            name: booking.contact.name || "",
            firstName: booking.contact.name?.split(" ")[0] || "",
            email: booking.contact.email,
          },
          booking: {
            id: booking.id,
            service: serviceName,
            date: format(zonedDate, "EEEE, MMMM d, yyyy"),
            time: format(zonedDate, "h:mm a"),
            duration: `${booking.duration} minutes`,
            rescheduleUrl: rescheduleUrl || "#",
            cancelUrl: cancelUrl || "#",
          },
          business: {
            name: booking.tenant.name,
            address: booking.tenant.address || "",
            phone: booking.tenant.phone || "",
            email: booking.tenant.email || "",
          },
        });

        // Update reminder as sent
        await prisma.bookingReminder.update({
          where: { id: reminder.id },
          data: { status: "sent", sentAt: now },
        });

        results.sent.push({
          id: reminder.id,
          bookingId: booking.id,
          contactEmail: booking.contact.email,
        });

        console.log(`[Cron] Sent reminder ${reminder.id} for booking ${booking.id}`);
      } catch (error) {
        console.error(`[Cron] Error sending reminder ${reminder.id}:`, error);

        await prisma.bookingReminder.update({
          where: { id: reminder.id },
          data: { status: "failed", error: error.message },
        });

        results.errors.push({
          id: reminder.id,
          bookingId: booking.id,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.created.length}, sent ${results.sent.length} reminder(s)`,
      details: {
        created: results.created.length,
        sent: results.sent.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
      results,
    });
  } catch (error) {
    console.error("[Cron] Error in send-booking-reminders:", error);
    return NextResponse.json(
      {
        error: "Failed to process booking reminders",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
