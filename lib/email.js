import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "ClientFlow <noreply@getclientflow.app>";

/**
 * Fetch a tenant's email template by system key
 * Returns the template if found, null otherwise
 */
async function getTenantTemplate(tenantId, systemKey) {
  if (!tenantId || !systemKey) return null;

  try {
    const template = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        systemKey,
      },
    });
    return template;
  } catch (error) {
    console.error(`Error fetching template ${systemKey}:`, error);
    return null;
  }
}

function formatTime(time) {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export async function sendBookingConfirmation({
  to,
  name,
  callType,
  date,
  time,
  duration,
  meetLink,
}) {
  const formattedDate = formatDate(date);
  const formattedTime = formatTime(time);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Booking Confirmed! ✓</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${name},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your ${callType} call has been scheduled. Here are the details:
              </p>

              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Call Type</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${callType}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Date</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Time</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedTime} (${duration} minutes)</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${meetLink ? `
              <!-- Google Meet Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${meetLink}" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Join Google Meet →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                Or copy this link: <a href="${meetLink}" style="color: #2563eb;">${meetLink}</a>
              </p>
              ` : `
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; padding: 16px; background-color: #dbeafe; border-radius: 8px; text-align: center;">
                📹 We'll send you a meeting link before your scheduled call.
              </p>
              `}

              <!-- What's Next -->
              <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px 0;">What's Next?</h3>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                ${meetLink ? '<li>Save the Google Meet link above</li>' : '<li>Look out for your meeting link email</li>'}
                <li>Join at your scheduled time</li>
                <li>Need to reschedule? Reply to this email</li>
              </ul>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ClientFlow • <a href="https://getclientflow.app" style="color: #2563eb; text-decoration: none;">getclientflow.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Booking Confirmed!

Hi ${name},

Your ${callType} call has been scheduled.

Details:
- Call Type: ${callType}
- Date: ${formattedDate}
- Time: ${formattedTime} (${duration} minutes)
${meetLink ? `- Google Meet: ${meetLink}` : "- Meeting link will be sent before your call"}

What's Next:
${meetLink ? "- Save the Google Meet link above" : "- Look out for your meeting link email"}
- Join at your scheduled time
- Need to reschedule? Reply to this email

---
ClientFlow
https://getclientflow.app
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Booking Confirmed: ${callType} on ${formattedDate}`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }

    console.log("Email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}

/**
 * Format currency amount
 */
function formatCurrency(amount, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Send invoice email to client
 */
export async function sendInvoiceEmail({
  to,
  contactName,
  businessName,
  invoiceNumber,
  total,
  currency,
  dueDate,
  viewUrl,
  payUrl,
  pdfAttachment,
}) {
  const formattedDueDate = formatDate(dueDate);
  const formattedTotal = formatCurrency(total, currency);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from ${businessName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Invoice from ${businessName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${contactName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Please find attached your invoice. Here are the details:
              </p>

              <!-- Invoice Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Invoice Number</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${invoiceNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Amount Due</span><br>
                          <span style="color: #111827; font-size: 24px; font-weight: 700;">${formattedTotal}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Due Date</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDueDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Pay Now Button -->
              ${payUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${payUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Pay Now →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- View Invoice Link -->
              ${viewUrl ? `
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                <a href="${viewUrl}" style="color: #7c3aed;">View Invoice Online</a>
              </p>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you have any questions about this invoice, please reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${businessName} • Powered by <a href="https://getclientflow.app" style="color: #7c3aed; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Invoice from ${businessName}

Hi ${contactName},

Please find your invoice details below:

Invoice Number: ${invoiceNumber}
Amount Due: ${formattedTotal}
Due Date: ${formattedDueDate}

${payUrl ? `Pay online: ${payUrl}` : ""}
${viewUrl ? `View invoice: ${viewUrl}` : ""}

If you have any questions about this invoice, please reply to this email.

---
${businessName}
Powered by ClientFlow
  `.trim();

  try {
    const emailOptions = {
      from: FROM_EMAIL,
      to: [to],
      subject: `Invoice ${invoiceNumber} from ${businessName}`,
      html,
      text,
    };

    // Add PDF attachment if provided
    if (pdfAttachment) {
      emailOptions.attachments = [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfAttachment,
        },
      ];
    }

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error("Error sending invoice email:", error);
      return { success: false, error };
    }

    console.log("Invoice email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send invoice email:", error);
    return { success: false, error };
  }
}

/**
 * Send booking confirmation to client (new format)
 * @param {Object} options
 * @param {string} options.tenantId - Tenant ID (optional, for template lookup)
 */
export async function sendNewBookingConfirmation({
  to,
  businessName,
  businessPhone,
  businessEmail,
  businessAddress,
  contactName,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  notes,
  bookingId,
  tenantId,
}) {
  const formattedDate = formatDate(scheduledAt);
  const formattedTime = new Date(scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedPrice = formatCurrency(totalPrice, "usd");

  // Try to use tenant's custom template
  if (tenantId) {
    const template = await getTenantTemplate(tenantId, "booking_confirmed");
    if (template) {
      const firstName = contactName?.split(" ")[0] || contactName;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";
      const variables = {
        contact: {
          name: contactName,
          firstName,
        },
        booking: {
          service: serviceName,
          date: formattedDate,
          time: formattedTime,
          duration: `${duration} minutes`,
          price: formattedPrice,
          confirmationNumber: bookingId?.slice(-8).toUpperCase() || bookingId,
          rescheduleUrl: `${baseUrl}/reschedule/${bookingId}`,
          cancelUrl: `${baseUrl}/cancel/${bookingId}`,
        },
        business: {
          name: businessName,
          email: businessEmail || "",
          phone: businessPhone || "",
          address: businessAddress || "",
        },
      };

      return sendTemplatedEmail({
        to,
        subject: template.subject,
        body: template.body,
        variables,
      });
    }
  }

  // Fall back to hardcoded template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Booking Request Received ✓</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${contactName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for booking with ${businessName}! We've received your request and will confirm your appointment shortly.
              </p>

              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Confirmation #</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${bookingId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Service</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Date & Time</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDate} at ${formattedTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Duration</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${duration} minutes</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Total</span><br>
                          <span style="color: #111827; font-size: 20px; font-weight: 700;">${formattedPrice}</span>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Notes</span><br>
                          <span style="color: #111827; font-size: 14px;">${notes}</span>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px 0;">Contact Information</h3>
              <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0;">
                ${businessName}<br>
                ${businessPhone ? `Phone: ${businessPhone}<br>` : ""}
                ${businessEmail ? `Email: ${businessEmail}<br>` : ""}
                ${businessAddress || ""}
              </p>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Need to make changes? Please contact us directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${businessName} • Powered by <a href="https://getclientflow.app" style="color: #10b981; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Booking Request Received!

Hi ${contactName},

Thank you for booking with ${businessName}! We've received your request and will confirm your appointment shortly.

Booking Details:
- Confirmation #: ${bookingId}
- Service: ${serviceName}
- Date & Time: ${formattedDate} at ${formattedTime}
- Duration: ${duration} minutes
- Total: ${formattedPrice}
${notes ? `- Notes: ${notes}` : ""}

Contact Information:
${businessName}
${businessPhone ? `Phone: ${businessPhone}` : ""}
${businessEmail ? `Email: ${businessEmail}` : ""}
${businessAddress || ""}

Need to make changes? Please contact us directly.

---
${businessName}
Powered by ClientFlow
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Booking Confirmation - ${businessName}`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending booking confirmation:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send booking confirmation:", error);
    return { success: false, error };
  }
}

/**
 * Send new booking notification to business owner
 */
/**
 * Replace template variables with actual values
 * Variables format: {{category.field}} e.g., {{client.firstName}}, {{booking.date}}
 */
function replaceTemplateVariables(template, variables) {
  if (!template) return template;

  return template.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, category, field) => {
    const categoryData = variables[category];
    if (categoryData && categoryData[field] !== undefined) {
      return categoryData[field];
    }
    return match; // Keep original if not found
  });
}

/**
 * Send a templated email using an email template
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject (with variables)
 * @param {string} options.body - Email HTML body (with variables)
 * @param {Object} options.variables - Variable data for replacement
 */
export async function sendTemplatedEmail({ to, subject, body, variables = {} }) {
  const processedSubject = replaceTemplateVariables(subject, variables);
  const processedBody = replaceTemplateVariables(body, variables);

  // Wrap the body in a styled email template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px; color: #374151; font-size: 16px; line-height: 1.6;">
              ${processedBody}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                Powered by <a href="https://getclientflow.app" style="color: #3b82f6; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  // Generate plain text version by stripping HTML
  const text = processedBody
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: processedSubject,
      html,
      text,
    });

    if (error) {
      console.error("Error sending templated email:", error);
      return { success: false, error };
    }

    console.log("Templated email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send templated email:", error);
    return { success: false, error };
  }
}

/**
 * Send dispute notification to tenant
 */
export async function sendDisputeNotification({
  to,
  businessName,
  paymentAmount,
  clientName,
  clientEmail,
  disputeReason,
  disputeId,
  chargeId,
  dashboardUrl,
}) {
  const formattedAmount = formatCurrency(paymentAmount, "usd");

  const reasonDescriptions = {
    duplicate: "Customer claims this is a duplicate charge",
    fraudulent: "Customer claims they didn't authorize this payment",
    subscription_canceled: "Customer claims subscription was canceled",
    product_unacceptable: "Customer claims product/service was not as described",
    product_not_received: "Customer claims product/service was not received",
    unrecognized: "Customer doesn't recognize the charge",
    credit_not_processed: "Customer claims a credit/refund was not processed",
    general: "General dispute",
  };

  const reasonText = reasonDescriptions[disputeReason] || disputeReason;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Dispute Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">⚠️ Payment Dispute Received</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                A customer has disputed a payment. <strong>You have limited time to respond</strong> - typically 7-21 days depending on the card network.
              </p>

              <!-- Urgent Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #dc2626;">Action Required:</strong>
                    <span style="color: #991b1b;"> Submit evidence via your Stripe Dashboard to challenge this dispute.</span>
                  </td>
                </tr>
              </table>

              <!-- Dispute Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Disputed Amount</span><br>
                          <span style="color: #dc2626; font-size: 20px; font-weight: 700;">${formattedAmount}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Customer</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${clientName || "Unknown"}</span>
                          ${clientEmail ? `<br><span style="color: #6b7280; font-size: 14px;">${clientEmail}</span>` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Reason</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${reasonText}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Dispute ID</span><br>
                          <span style="color: #6b7280; font-size: 14px; font-family: monospace;">${disputeId}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What to do next -->
              <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px 0;">What to do next:</h3>
              <ol style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Review the dispute in your Stripe Dashboard</li>
                <li>Gather evidence: receipts, communications, service records</li>
                <li>Submit your evidence before the deadline</li>
                <li>If the dispute is valid, you can accept it to avoid additional fees</li>
              </ol>

              <!-- Stripe Dashboard Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl || 'https://dashboard.stripe.com/disputes'}" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Respond to Dispute →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${businessName} • Powered by <a href="https://getclientflow.app" style="color: #dc2626; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
⚠️ PAYMENT DISPUTE RECEIVED

A customer has disputed a payment. You have limited time to respond - typically 7-21 days.

ACTION REQUIRED: Submit evidence via your Stripe Dashboard to challenge this dispute.

Dispute Details:
- Amount: ${formattedAmount}
- Customer: ${clientName || "Unknown"}${clientEmail ? ` (${clientEmail})` : ""}
- Reason: ${reasonText}
- Dispute ID: ${disputeId}

What to do next:
1. Review the dispute in your Stripe Dashboard
2. Gather evidence: receipts, communications, service records
3. Submit your evidence before the deadline
4. If the dispute is valid, you can accept it to avoid additional fees

Respond to dispute: ${dashboardUrl || 'https://dashboard.stripe.com/disputes'}

---
${businessName}
Powered by ClientFlow
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `⚠️ Payment Dispute: ${formattedAmount} - Action Required`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending dispute notification:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send dispute notification:", error);
    return { success: false, error };
  }
}

/**
 * Send trial ending notification to tenant
 */
export async function sendTrialEndingNotification({
  to,
  businessName,
  planName,
  trialEndDate,
  billingUrl,
}) {
  const formattedEndDate = formatDate(trialEndDate);
  const daysLeft = Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial is Ending Soon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Your Trial is Ending Soon</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi there,
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Your free trial of <strong>${planName}</strong> for ${businessName || "your business"} will end in <strong>${daysLeft} day${daysLeft !== 1 ? "s" : ""}</strong> on ${formattedEndDate}.
              </p>

              <!-- Trial Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #dbeafe; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #1e40af;">Your subscription will start automatically:</strong>
                    <span style="color: #1e3a8a;"> Your card on file will be charged when your trial ends. Cancel anytime to avoid charges.</span>
                  </td>
                </tr>
              </table>

              <!-- Plan Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Current Plan</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${planName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Trial Ends</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedEndDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What Happens Next -->
              <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin: 24px 0 12px 0;">What happens next?</h3>
              <ul style="color: #374151; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Your card on file will be automatically charged when your trial ends</li>
                <li>No action needed - your service will continue without interruption</li>
                <li>You can cancel anytime before ${formattedEndDate} to avoid charges</li>
              </ul>

              <!-- View Billing Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${billingUrl || 'https://app.getclientflow.app/dashboard/settings/billing'}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Manage Billing →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Questions? Just reply to this email and we'll be happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ClientFlow • <a href="https://getclientflow.app" style="color: #2563eb; text-decoration: none;">getclientflow.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Your Trial is Ending Soon

Hi there,

Your free trial of ${planName} for ${businessName || "your business"} will end in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} on ${formattedEndDate}.

Current Plan: ${planName}
Trial Ends: ${formattedEndDate}

Your subscription will start automatically:
Your card on file will be charged when your trial ends. Cancel anytime to avoid charges.

What happens next?
- Your card on file will be automatically charged when your trial ends
- No action needed - your service will continue without interruption
- You can cancel anytime before ${formattedEndDate} to avoid charges

Manage your billing: ${billingUrl || 'https://app.getclientflow.app/dashboard/settings/billing'}

Questions? Just reply to this email and we'll be happy to help.

---
ClientFlow
https://getclientflow.app
  `.trim();

  try {
    const { data, error} = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} - Billing starts ${formattedEndDate}`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending trial ending notification:", error);
      return { success: false, error };
    }

    console.log("Trial ending email sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send trial ending notification:", error);
    return { success: false, error };
  }
}

export async function sendNewBookingNotification({
  to,
  businessName,
  contactName,
  contactEmail,
  clientPhone,
  serviceName,
  scheduledAt,
  duration,
  totalPrice,
  notes,
  dashboardUrl,
}) {
  const formattedDate = formatDate(scheduledAt);
  const formattedTime = new Date(scheduledAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedPrice = formatCurrency(totalPrice, "usd");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">New Booking Request!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                You have a new booking request for ${businessName}.
              </p>

              <!-- Client Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #92400e;">Client:</strong>
                    <span style="color: #92400e;"> ${contactName} • ${contactEmail}${clientPhone ? ` • ${clientPhone}` : ""}</span>
                  </td>
                </tr>
              </table>

              <!-- Booking Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Service</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${serviceName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Date & Time</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDate} at ${formattedTime}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Duration</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${duration} minutes</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Total</span><br>
                          <span style="color: #111827; font-size: 20px; font-weight: 700;">${formattedPrice}</span>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Notes from client</span><br>
                          <span style="color: #111827; font-size: 14px;">${notes}</span>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- View in Dashboard Button -->
              ${dashboardUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      View in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ClientFlow • <a href="https://getclientflow.app" style="color: #f59e0b; text-decoration: none;">getclientflow.app</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
New Booking Request!

You have a new booking request for ${businessName}.

Client: ${contactName}
Email: ${contactEmail}
${clientPhone ? `Phone: ${clientPhone}` : ""}

Booking Details:
- Service: ${serviceName}
- Date & Time: ${formattedDate} at ${formattedTime}
- Duration: ${duration} minutes
- Total: ${formattedPrice}
${notes ? `- Notes: ${notes}` : ""}

${dashboardUrl ? `View in Dashboard: ${dashboardUrl}` : ""}

---
ClientFlow
https://getclientflow.app
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `New Booking: ${contactName} - ${serviceName}`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending booking notification:", error);
      return { success: false, error };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send booking notification:", error);
    return { success: false, error };
  }
}

/**
 * Send payment reminder for overdue invoice
 * @param {Object} options
 * @param {string} options.tenantId - Tenant ID (optional, for template lookup)
 */
export async function sendPaymentReminder({
  to,
  contactName,
  businessName,
  businessPhone,
  businessEmail,
  invoiceNumber,
  total,
  balanceDue,
  currency,
  dueDate,
  daysOverdue,
  viewUrl,
  payUrl,
  tenantId,
}) {
  const formattedDueDate = formatDate(dueDate);
  const formattedTotal = formatCurrency(total, currency);
  const formattedBalance = formatCurrency(balanceDue, currency);

  const urgencyLevel = daysOverdue >= 15 ? "final" : daysOverdue >= 8 ? "urgent" : "gentle";

  // Try to use tenant's custom template
  if (tenantId) {
    const templateKeyMap = {
      gentle: "payment_reminder_gentle",
      urgent: "payment_reminder_urgent",
      final: "payment_reminder_final",
    };
    const template = await getTenantTemplate(tenantId, templateKeyMap[urgencyLevel]);

    if (template) {
      const firstName = contactName?.split(" ")[0] || contactName;
      const variables = {
        contact: {
          name: contactName,
          firstName,
        },
        invoice: {
          number: invoiceNumber,
          amount: formattedTotal,
          balanceDue: formattedBalance,
          dueDate: formattedDueDate,
          paymentUrl: payUrl || viewUrl || "#",
        },
        business: {
          name: businessName,
          email: businessEmail || "",
          phone: businessPhone || "",
        },
      };

      return sendTemplatedEmail({
        to,
        subject: template.subject,
        body: template.body,
        variables,
      });
    }
  }

  // Fall back to hardcoded template (original urgency levels)

  const headerColors = {
    gentle: { from: "#f59e0b", to: "#d97706" },
    urgent: { from: "#ef4444", to: "#dc2626" },
    final: { from: "#dc2626", to: "#991b1b" },
  };

  const headerTexts = {
    gentle: "Payment Reminder",
    urgent: "Urgent: Payment Overdue",
    final: "Final Notice: Payment Required",
  };

  const colors = headerColors[urgencyLevel];
  const headerText = headerTexts[urgencyLevel];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${headerText}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${contactName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                ${urgencyLevel === "final"
                  ? `This is a final reminder that invoice <strong>${invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>. Immediate payment is required to avoid service interruption.`
                  : urgencyLevel === "urgent"
                  ? `Invoice <strong>${invoiceNumber}</strong> is now <strong>${daysOverdue} days overdue</strong>. Please submit payment at your earliest convenience.`
                  : `This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> was due on ${formattedDueDate} and is now ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`}
              </p>

              <!-- Invoice Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Invoice Number</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${invoiceNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Original Due Date</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedDueDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Days Overdue</span><br>
                          <span style="color: #dc2626; font-size: 20px; font-weight: 700;">${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Amount Due</span><br>
                          <span style="color: #111827; font-size: 24px; font-weight: 700;">${formattedBalance}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Pay Now Button -->
              ${payUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${payUrl}" style="display: inline-block; background-color: ${colors.to}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Pay Now →
                    </a>
                  </td>
                </tr>
              </table>
              ` : ""}

              <!-- View Invoice Link -->
              ${viewUrl ? `
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                <a href="${viewUrl}" style="color: ${colors.to};">View Invoice Online</a>
              </p>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                If you've already sent payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${businessName} • Powered by <a href="https://getclientflow.app" style="color: ${colors.to}; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
${headerText}

Hi ${contactName},

${urgencyLevel === "final"
  ? `This is a final reminder that invoice ${invoiceNumber} is now ${daysOverdue} days overdue. Immediate payment is required to avoid service interruption.`
  : urgencyLevel === "urgent"
  ? `Invoice ${invoiceNumber} is now ${daysOverdue} days overdue. Please submit payment at your earliest convenience.`
  : `This is a friendly reminder that invoice ${invoiceNumber} was due on ${formattedDueDate} and is now ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue.`}

Invoice Details:
- Invoice Number: ${invoiceNumber}
- Original Due Date: ${formattedDueDate}
- Days Overdue: ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""}
- Amount Due: ${formattedBalance}

${payUrl ? `Pay online: ${payUrl}` : ""}
${viewUrl ? `View invoice: ${viewUrl}` : ""}

If you've already sent payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please reply to this email.

---
${businessName}
Powered by ClientFlow
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${urgencyLevel === "final" ? "FINAL NOTICE: " : urgencyLevel === "urgent" ? "URGENT: " : ""}Invoice ${invoiceNumber} - Payment ${daysOverdue} Days Overdue`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending payment reminder:", error);
      return { success: false, error };
    }

    console.log("Payment reminder sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send payment reminder:", error);
    return { success: false, error };
  }
}

/**
 * Send payment confirmation email
 * @param {Object} options
 * @param {string} options.tenantId - Tenant ID (optional, for template lookup)
 */
export async function sendPaymentConfirmation({
  to,
  contactName,
  businessName,
  invoiceNumber,
  amountPaid,
  balanceDue,
  currency,
  paidAt,
  viewUrl,
  tenantId,
  paymentMethod = "Card",
  confirmationNumber,
}) {
  const formattedPaidAt = formatDate(paidAt);
  const formattedAmountPaid = formatCurrency(amountPaid, currency);
  const formattedBalance = balanceDue > 0 ? formatCurrency(balanceDue, currency) : null;

  // Try to use tenant's custom template
  if (tenantId) {
    const template = await getTenantTemplate(tenantId, "payment_received");
    if (template) {
      const firstName = contactName?.split(" ")[0] || contactName;
      const variables = {
        contact: {
          name: contactName,
          firstName,
        },
        payment: {
          amount: formattedAmountPaid,
          date: formattedPaidAt,
          method: paymentMethod,
          confirmationNumber: confirmationNumber || invoiceNumber,
          receiptUrl: viewUrl || "#",
        },
        invoice: {
          number: invoiceNumber,
          balanceDue: formattedBalance || "$0.00",
        },
        business: {
          name: businessName,
        },
      };

      return sendTemplatedEmail({
        to,
        subject: template.subject,
        body: template.body,
        variables,
      });
    }
  }

  // Fall back to hardcoded template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Payment Received!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Hi ${contactName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you! We've received your payment for invoice <strong>${invoiceNumber}</strong>.
              </p>

              <!-- Success Notice -->
              ${balanceDue === 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #d1fae5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #065f46;">✓ Paid in Full:</strong>
                    <span style="color: #065f46;"> This invoice has been paid in full. No further payment is required.</span>
                  </td>
                </tr>
              </table>
              ` : `
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <strong style="color: #92400e;">Partial Payment:</strong>
                    <span style="color: #92400e;"> A balance of ${formattedBalance} remains on this invoice.</span>
                  </td>
                </tr>
              </table>
              `}

              <!-- Payment Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Invoice Number</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${invoiceNumber}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Payment Date</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 600;">${formattedPaidAt}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Amount Paid</span><br>
                          <span style="color: #10b981; font-size: 24px; font-weight: 700;">${formattedAmountPaid}</span>
                        </td>
                      </tr>
                      ${balanceDue > 0 ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 14px;">Remaining Balance</span><br>
                          <span style="color: #dc2626; font-size: 20px; font-weight: 700;">${formattedBalance}</span>
                        </td>
                      </tr>
                      ` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- View Invoice Link -->
              ${viewUrl ? `
              <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0 0 24px 0;">
                <a href="${viewUrl}" style="color: #10b981;">View Invoice & Receipt</a>
              </p>
              ` : ""}

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                Keep this email for your records. If you have any questions, please reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                ${businessName} • Powered by <a href="https://getclientflow.app" style="color: #10b981; text-decoration: none;">ClientFlow</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `
Payment Received!

Hi ${contactName},

Thank you! We've received your payment for invoice ${invoiceNumber}.

${balanceDue === 0
  ? "✓ Paid in Full: This invoice has been paid in full. No further payment is required."
  : `Partial Payment: A balance of ${formattedBalance} remains on this invoice.`}

Payment Details:
- Invoice Number: ${invoiceNumber}
- Payment Date: ${formattedPaidAt}
- Amount Paid: ${formattedAmountPaid}
${balanceDue > 0 ? `- Remaining Balance: ${formattedBalance}` : ""}

${viewUrl ? `View Invoice & Receipt: ${viewUrl}` : ""}

Keep this email for your records. If you have any questions, please reply to this email.

---
${businessName}
Powered by ClientFlow
  `.trim();

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Payment Received - Invoice ${invoiceNumber}`,
      html,
      text,
    });

    if (error) {
      console.error("Error sending payment confirmation:", error);
      return { success: false, error };
    }

    console.log("Payment confirmation sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send payment confirmation:", error);
    return { success: false, error };
  }
}
