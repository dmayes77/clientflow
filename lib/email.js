import { resend } from "@/lib/resend";
import { render } from "@react-email/render";

// Admin emails
import { OnboardingCompleteEmail } from "@/emails/admin/onboarding-complete";
import { FeatureRequestEmail } from "@/emails/admin/feature-request";
import { SupportRequestEmail } from "@/emails/admin/support-request";

// Tenant emails
import { WelcomeEmail } from "@/emails/tenant/welcome";
import { PaymentReminderEmail } from "@/emails/tenant/payment-reminder";
import { PaymentFailedEmail } from "@/emails/tenant/payment-failed";
import { NewBookingEmail } from "@/emails/tenant/new-booking";

// Client emails
import { BookingConfirmationEmail } from "@/emails/client/booking-confirmation";
import { BookingReminderEmail } from "@/emails/client/booking-reminder";
import { BookingCancelledEmail } from "@/emails/client/booking-cancelled";
import { BookingRescheduledEmail } from "@/emails/client/booking-rescheduled";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dmayes77@gmail.com";
const DEFAULT_FROM = "ClientFlow <notifications@getclientflow.app>";

/**
 * Send an email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} [options.from] - Sender email (defaults to DEFAULT_FROM)
 * @param {string} [options.replyTo] - Reply-to email
 */
async function sendEmail({ to, subject, html, from = DEFAULT_FROM, replyTo }) {
  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      ...(replyTo && { replyTo }),
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error: error.message };
  }
}

// ==========================================
// Admin Notifications
// ==========================================

export async function sendOnboardingCompleteNotification(tenantData) {
  const html = await render(OnboardingCompleteEmail(tenantData));
  return sendEmail({
    to: ADMIN_EMAIL,
    from: "ClientFlow Onboarding <onboarding@getclientflow.app>",
    subject: `New Business Onboarding Complete: ${tenantData.businessName || "New Business"}`,
    html,
  });
}

export async function sendFeatureRequestNotification({ email, feature, requestId }) {
  const html = await render(FeatureRequestEmail({ email, feature, requestId }));
  return sendEmail({
    to: ADMIN_EMAIL,
    from: "ClientFlow Feedback <feedback@getclientflow.app>",
    subject: `New Feature Request from ${email}`,
    html,
    replyTo: email,
  });
}

export async function sendSupportRequestNotification({ name, email, subject, message }) {
  const html = await render(SupportRequestEmail({ name, email, subject, message }));
  return sendEmail({
    to: ADMIN_EMAIL,
    from: "ClientFlow Support <support@getclientflow.app>",
    subject: `[Support] ${subject}`,
    html,
    replyTo: email,
  });
}

// ==========================================
// Tenant Notifications
// ==========================================

export async function sendWelcomeEmail({ to, businessName, ownerName, loginUrl }) {
  const html = await render(WelcomeEmail({ businessName, ownerName, loginUrl }));
  return sendEmail({
    to,
    from: "ClientFlow <welcome@getclientflow.app>",
    subject: `Welcome to ClientFlow, ${ownerName || businessName}!`,
    html,
  });
}

export async function sendPaymentReminderEmail({
  to,
  businessName,
  planType,
  amount,
  currency,
  renewalDate,
  billingUrl,
}) {
  const html = await render(
    PaymentReminderEmail({
      businessName,
      planType,
      amount,
      currency,
      renewalDate,
      billingUrl,
    })
  );
  return sendEmail({
    to,
    from: "ClientFlow Billing <billing@getclientflow.app>",
    subject: `Payment reminder: Your ${planType} subscription renews soon`,
    html,
  });
}

export async function sendPaymentFailedEmail({
  to,
  businessName,
  planType,
  amount,
  currency,
  failureReason,
  retryDate,
  billingUrl,
}) {
  const html = await render(
    PaymentFailedEmail({
      businessName,
      planType,
      amount,
      currency,
      failureReason,
      retryDate,
      billingUrl,
    })
  );
  return sendEmail({
    to,
    from: "ClientFlow Billing <billing@getclientflow.app>",
    subject: "Action required: Your ClientFlow payment failed",
    html,
  });
}

export async function sendNewBookingNotification({
  to,
  businessName,
  clientName,
  clientEmail,
  clientPhone,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  currency,
  notes,
  dashboardUrl,
}) {
  const html = await render(
    NewBookingEmail({
      businessName,
      clientName,
      clientEmail,
      clientPhone,
      serviceName,
      scheduledAt,
      duration,
      totalPrice,
      currency,
      notes,
      dashboardUrl,
    })
  );
  return sendEmail({
    to,
    from: "ClientFlow <bookings@getclientflow.app>",
    subject: `New booking: ${clientName} booked ${serviceName}`,
    html,
  });
}

// ==========================================
// Client Notifications (sent on behalf of tenant)
// ==========================================

/**
 * Build the "from" address for client-facing emails
 * Uses the tenant's business name in the display name
 */
function buildTenantFrom(businessName) {
  const sanitizedName = businessName?.replace(/[<>"]/g, "") || "Your Business";
  return `${sanitizedName} <bookings@getclientflow.app>`;
}

export async function sendBookingConfirmation({
  to,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  currency,
  notes,
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) {
  const html = await render(
    BookingConfirmationEmail({
      businessName,
      businessPhone,
      businessEmail,
      businessAddress,
      clientName,
      serviceName,
      scheduledAt,
      duration,
      totalPrice,
      currency,
      notes,
      bookingId,
      cancelUrl,
      rescheduleUrl,
    })
  );
  return sendEmail({
    to,
    from: buildTenantFrom(businessName),
    subject: `Booking confirmed with ${businessName}`,
    html,
    replyTo: businessEmail,
  });
}

export async function sendBookingReminder({
  to,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  scheduledAt,
  duration,
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) {
  const html = await render(
    BookingReminderEmail({
      businessName,
      businessPhone,
      businessEmail,
      businessAddress,
      clientName,
      serviceName,
      scheduledAt,
      duration,
      bookingId,
      cancelUrl,
      rescheduleUrl,
    })
  );
  return sendEmail({
    to,
    from: buildTenantFrom(businessName),
    subject: `Reminder: Your appointment with ${businessName}`,
    html,
    replyTo: businessEmail,
  });
}

export async function sendBookingCancellation({
  to,
  businessName,
  businessPhone,
  businessEmail,
  clientName,
  serviceName,
  scheduledAt,
  cancelledBy,
  cancellationReason,
  refundAmount,
  currency,
  rebookUrl,
}) {
  const html = await render(
    BookingCancelledEmail({
      businessName,
      businessPhone,
      businessEmail,
      clientName,
      serviceName,
      scheduledAt,
      cancelledBy,
      cancellationReason,
      refundAmount,
      currency,
      rebookUrl,
    })
  );
  return sendEmail({
    to,
    from: buildTenantFrom(businessName),
    subject: `Booking cancelled with ${businessName}`,
    html,
    replyTo: businessEmail,
  });
}

export async function sendBookingRescheduled({
  to,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  clientName,
  serviceName,
  previousScheduledAt,
  newScheduledAt,
  duration,
  rescheduledBy,
  bookingId,
  cancelUrl,
  rescheduleUrl,
}) {
  const html = await render(
    BookingRescheduledEmail({
      businessName,
      businessPhone,
      businessEmail,
      businessAddress,
      clientName,
      serviceName,
      previousScheduledAt,
      newScheduledAt,
      duration,
      rescheduledBy,
      bookingId,
      cancelUrl,
      rescheduleUrl,
    })
  );
  return sendEmail({
    to,
    from: buildTenantFrom(businessName),
    subject: `Appointment rescheduled with ${businessName}`,
    html,
    replyTo: businessEmail,
  });
}
