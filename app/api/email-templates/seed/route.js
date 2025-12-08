import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

const SAMPLE_TEMPLATES = [
  {
    name: "Booking Confirmation",
    subject: "Your appointment is confirmed - {{booking.service}}",
    category: "booking",
    description: "Sent when a client books an appointment",
    body: `<p>Hi {{client.firstName}},</p>

<p>Great news! Your appointment has been confirmed.</p>

<p><strong>Appointment Details:</strong></p>
<ul>
  <li><strong>Service:</strong> {{booking.service}}</li>
  <li><strong>Date:</strong> {{booking.date}}</li>
  <li><strong>Time:</strong> {{booking.time}}</li>
  <li><strong>Duration:</strong> {{booking.duration}}</li>
  <li><strong>Price:</strong> {{booking.price}}</li>
  <li><strong>Confirmation #:</strong> {{booking.confirmationNumber}}</li>
</ul>

<p><strong>Location:</strong><br>{{business.address}}</p>

<p>Need to make changes? You can <a href="{{booking.rescheduleUrl}}">reschedule</a> or <a href="{{booking.cancelUrl}}">cancel</a> your appointment.</p>

<p>If you have any questions, feel free to contact us at {{business.email}} or {{business.phone}}.</p>

<p>We look forward to seeing you!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Booking Reminder",
    subject: "Reminder: Your appointment is coming up - {{booking.service}}",
    category: "reminder",
    description: "Sent 24 hours before an appointment",
    body: `<p>Hi {{client.firstName}},</p>

<p>This is a friendly reminder that your appointment is coming up soon!</p>

<p><strong>Appointment Details:</strong></p>
<ul>
  <li><strong>Service:</strong> {{booking.service}}</li>
  <li><strong>Date:</strong> {{booking.date}}</li>
  <li><strong>Time:</strong> {{booking.time}}</li>
  <li><strong>Duration:</strong> {{booking.duration}}</li>
  <li><strong>Confirmation #:</strong> {{booking.confirmationNumber}}</li>
</ul>

<p><strong>Location:</strong><br>{{business.address}}</p>

<p><em>Please arrive 5-10 minutes early. If you need to cancel or reschedule, please give us at least 24 hours notice.</em></p>

<p>Need to make changes? You can <a href="{{booking.rescheduleUrl}}">reschedule</a> or <a href="{{booking.cancelUrl}}">cancel</a> your appointment.</p>

<p>See you soon!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Booking Cancelled",
    subject: "Your appointment has been cancelled",
    category: "booking",
    description: "Sent when an appointment is cancelled",
    body: `<p>Hi {{client.firstName}},</p>

<p>Your appointment has been cancelled as requested.</p>

<p><strong>Cancelled Appointment:</strong></p>
<ul>
  <li><strong>Service:</strong> {{booking.service}}</li>
  <li><strong>Date:</strong> {{booking.date}}</li>
  <li><strong>Time:</strong> {{booking.time}}</li>
  <li><strong>Confirmation #:</strong> {{booking.confirmationNumber}}</li>
</ul>

<p>We're sorry to see you go! If you'd like to book a new appointment, please visit our booking page.</p>

<p>If you have any questions, feel free to contact us at {{business.email}} or {{business.phone}}.</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Booking Rescheduled",
    subject: "Your appointment has been rescheduled - {{booking.service}}",
    category: "booking",
    description: "Sent when an appointment is rescheduled",
    body: `<p>Hi {{client.firstName}},</p>

<p>Your appointment has been successfully rescheduled.</p>

<p><strong>New Appointment Details:</strong></p>
<ul>
  <li><strong>Service:</strong> {{booking.service}}</li>
  <li><strong>Date:</strong> {{booking.date}}</li>
  <li><strong>Time:</strong> {{booking.time}}</li>
  <li><strong>Duration:</strong> {{booking.duration}}</li>
  <li><strong>Confirmation #:</strong> {{booking.confirmationNumber}}</li>
</ul>

<p><strong>Location:</strong><br>{{business.address}}</p>

<p>Need to make more changes? You can <a href="{{booking.rescheduleUrl}}">reschedule again</a> or <a href="{{booking.cancelUrl}}">cancel</a> your appointment.</p>

<p>If you have any questions, feel free to contact us at {{business.email}} or {{business.phone}}.</p>

<p>We look forward to seeing you!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Invoice Receipt",
    subject: "Payment received - Invoice #{{invoice.number}}",
    category: "invoice",
    description: "Sent when a payment is received",
    body: `<p>Hi {{client.firstName}},</p>

<p>Thank you for your payment! This email confirms that we have received your payment.</p>

<p><strong>Payment Details:</strong></p>
<ul>
  <li><strong>Invoice #:</strong> {{invoice.number}}</li>
  <li><strong>Amount Paid:</strong> {{invoice.amount}}</li>
  <li><strong>Date Paid:</strong> {{invoice.paidDate}}</li>
</ul>

<p>You can <a href="{{invoice.pdfUrl}}">download your receipt</a> for your records.</p>

<p>Thank you for your business!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Welcome Email",
    subject: "Welcome to {{business.name}}!",
    category: "welcome",
    description: "Sent to new clients when they sign up",
    body: `<p>Hi {{client.firstName}},</p>

<p>Welcome to {{business.name}}! We're thrilled to have you.</p>

<p>Thank you for choosing us. We're committed to providing you with the best service possible.</p>

<p>Here's what you can do next:</p>
<ul>
  <li>Book your first appointment</li>
  <li>Explore our services</li>
  <li>Contact us if you have any questions</li>
</ul>

<p>If you have any questions, don't hesitate to reach out:</p>
<ul>
  <li><strong>Email:</strong> {{business.email}}</li>
  <li><strong>Phone:</strong> {{business.phone}}</li>
</ul>

<p>We look forward to serving you!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Thank You",
    subject: "Thank you for visiting {{business.name}}!",
    category: "thank-you",
    description: "Sent after a client completes an appointment",
    body: `<p>Hi {{client.firstName}},</p>

<p>Thank you for visiting us! We hope you had a great experience.</p>

<p>Your feedback means the world to us. If you have a moment, we'd love to hear how your appointment went.</p>

<p>Ready to book your next appointment? We'd love to see you again soon!</p>

<p>If you have any questions or concerns, please don't hesitate to contact us at {{business.email}} or {{business.phone}}.</p>

<p>Thank you for your business!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
  {
    name: "Follow Up",
    subject: "Following up - {{business.name}}",
    category: "follow-up",
    description: "Sent to follow up with leads or clients",
    body: `<p>Hi {{client.firstName}},</p>

<p>I wanted to follow up and see if you have any questions about our services.</p>

<p>At {{business.name}}, we're here to help you with all your needs. Whether you're ready to book an appointment or just have questions, I'm happy to assist.</p>

<p>Feel free to reach out anytime:</p>
<ul>
  <li><strong>Email:</strong> {{business.email}}</li>
  <li><strong>Phone:</strong> {{business.phone}}</li>
</ul>

<p>Looking forward to hearing from you!</p>

<p>Best regards,<br>{{business.name}}</p>`,
  },
];

// POST /api/email-templates/seed - Seed sample email templates
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check if templates already exist for this tenant
    const existingCount = await prisma.emailTemplate.count({
      where: { tenantId: tenant.id },
    });

    if (existingCount > 0) {
      return NextResponse.json(
        { error: "Templates already exist. Delete existing templates first or create new ones manually." },
        { status: 400 }
      );
    }

    // Create all sample templates
    const createdTemplates = await prisma.emailTemplate.createMany({
      data: SAMPLE_TEMPLATES.map((template) => ({
        ...template,
        tenantId: tenant.id,
      })),
    });

    return NextResponse.json({
      success: true,
      count: createdTemplates.count,
      message: `Created ${createdTemplates.count} sample email templates`,
    });
  } catch (error) {
    console.error("Error seeding email templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
