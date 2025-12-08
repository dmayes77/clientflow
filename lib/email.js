import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || "ClientFlow <noreply@getclientflow.app>";

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
  clientName,
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
                Hi ${clientName},
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

Hi ${clientName},

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
 */
export async function sendNewBookingConfirmation({
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
  notes,
  bookingId,
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
                Hi ${clientName},
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

Hi ${clientName},

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
                    <span style="color: #92400e;"> ${clientName} • ${clientEmail}${clientPhone ? ` • ${clientPhone}` : ""}</span>
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

Client: ${clientName}
Email: ${clientEmail}
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
      subject: `New Booking: ${clientName} - ${serviceName}`,
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
