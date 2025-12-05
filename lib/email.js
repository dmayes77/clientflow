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
