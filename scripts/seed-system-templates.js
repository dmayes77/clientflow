#!/usr/bin/env node

/**
 * Seed system email templates for all tenants
 *
 * This script creates the 6 system email templates for every tenant in the database.
 * System templates are used by cron jobs and automated processes to send emails
 * from the tenant to their customers.
 *
 * Run with: node scripts/seed-system-templates.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// System template definitions
const SYSTEM_TEMPLATES = {
  payment_reminder_gentle: {
    name: "Payment Reminder - Gentle",
    category: "payment",
    subject: "Friendly Reminder: Invoice {{invoice.number}} Due",
    body: `
      <h2>Hi {{contact.firstName}},</h2>
      <p>Just a friendly reminder that invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong> is now due.</p>
      <p>We know things get busy! If you've already sent payment, please disregard this reminder.</p>
      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Invoice</a>
      </div>
      <p>If you have any questions about this invoice, please don't hesitate to reach out.</p>
      <p>Best regards,<br>{{business.name}}</p>
    `,
    description: "Sent when invoice is 1-7 days overdue (gentle reminder)",
  },

  payment_reminder_urgent: {
    name: "Payment Reminder - Urgent",
    category: "payment",
    subject: "Urgent: Invoice {{invoice.number}} Past Due",
    body: `
      <h2>Hi {{contact.firstName}},</h2>
      <p>This is an urgent reminder that invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong> is now past due.</p>

      <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
        <p style="margin: 0;"><strong>Amount Due:</strong> {{invoice.balanceDue}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Original Due Date:</strong> {{invoice.dueDate}}</p>
        <p style="margin: 8px 0 0 0;"><strong>Invoice Number:</strong> {{invoice.number}}</p>
      </div>

      <p>Please submit payment as soon as possible to avoid any service interruptions.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a>
      </div>

      <p>If you're experiencing difficulty with payment, please contact us to discuss options.</p>
      <p>{{business.name}}<br>{{business.phone}}<br>{{business.email}}</p>
    `,
    description: "Sent when invoice is 8-14 days overdue (urgent reminder)",
  },

  payment_reminder_final: {
    name: "Payment Reminder - Final Notice",
    category: "payment",
    subject: "Final Notice: Invoice {{invoice.number}} - Action Required",
    body: `
      <div style="background-color: #7f1d1d; color: white; padding: 16px; text-align: center; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">FINAL NOTICE</h2>
      </div>

      <p>Dear {{contact.name}},</p>

      <p>This is a final notice regarding invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong>, which is significantly past due.</p>

      <div style="background-color: #fef2f2; border: 2px solid #dc2626; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>Amount Due:</strong> {{invoice.balanceDue}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Original Due Date:</strong> {{invoice.dueDate}}</p>
        <p style="margin: 12px 0 0 0;"><strong>Invoice Number:</strong> {{invoice.number}}</p>
      </div>

      <p><strong>Immediate payment is required.</strong> If payment is not received within 48 hours, we may need to suspend services or take additional collection measures.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{invoice.paymentUrl}}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Pay Immediately</a>
      </div>

      <p>If you have already sent payment or need to discuss payment arrangements, please contact us immediately at {{business.phone}}.</p>

      <p>{{business.name}}<br>{{business.email}}<br>{{business.phone}}</p>
    `,
    description: "Sent when invoice is 15+ days overdue (final notice)",
  },

  booking_confirmed: {
    name: "Booking Confirmation",
    category: "booking",
    subject: "Booking Confirmed - {{booking.service}} on {{booking.date}}",
    body: `
      <h2 style="color: #22c55e;">✓ Your Booking is Confirmed!</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>Great news! Your booking has been confirmed. Here are the details:</p>

      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 16px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>⏱️ Duration:</strong> {{booking.duration}}</p>
        <p style="margin: 8px 0 0 0;"><strong>💰 Price:</strong> {{booking.price}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🔖 Confirmation #:</strong> {{booking.confirmationNumber}}</p>
      </div>

      <p>We look forward to seeing you!</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{booking.rescheduleUrl}}" style="color: #3b82f6; text-decoration: none; margin-right: 24px; font-weight: 500;">📅 Reschedule</a>
        <a class="not-prose" href="{{booking.cancelUrl}}" style="color: #ef4444; text-decoration: none; font-weight: 500;">❌ Cancel</a>
      </div>

      <div style="background-color: #f0f9ff; padding: 16px; border-radius: 6px; margin-top: 24px;">
        <p style="margin: 0;"><strong>Location:</strong></p>
        <p style="margin: 4px 0 0 0;">{{business.name}}<br>{{business.address}}<br>{{business.phone}}</p>
      </div>
    `,
    description: "Sent when a booking is confirmed",
  },

  booking_reminder: {
    name: "Booking Reminder",
    category: "booking",
    subject: "Reminder: {{booking.service}} Tomorrow at {{booking.time}}",
    body: `
      <h2>Reminder: Your Appointment is Tomorrow</h2>
      <p>Hi {{contact.firstName}},</p>
      <p>This is a friendly reminder about your upcoming appointment:</p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 18px;"><strong>{{booking.service}}</strong></p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Date:</strong> {{booking.date}}</p>
        <p style="margin: 8px 0 0 0;"><strong>🕐 Time:</strong> {{booking.time}}</p>
        <p style="margin: 8px 0 0 0;"><strong>📍 Location:</strong> {{business.address}}</p>
      </div>

      <p>Please arrive 5-10 minutes early. If you need to reschedule or cancel, please let us know as soon as possible.</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{booking.rescheduleUrl}}" style="color: #3b82f6; text-decoration: none; margin-right: 24px;">Reschedule</a>
        <a class="not-prose" href="{{booking.cancelUrl}}" style="color: #ef4444; text-decoration: none;">Cancel</a>
      </div>

      <p>See you soon!</p>
      <p>{{business.name}}<br>{{business.phone}}</p>
    `,
    description: "Sent 24 hours before a booking",
  },

  payment_received: {
    name: "Payment Confirmation",
    category: "payment",
    subject: "Payment Received - Thank You!",
    body: `
      <div style="background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
        <h2 style="margin: 0; color: white;">✓ Payment Received</h2>
      </div>

      <p>Hi {{contact.firstName}},</p>
      <p>Thank you! We've successfully received your payment.</p>

      <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; font-size: 16px;"><strong>💰 Amount Paid:</strong> {{payment.amount}}</p>
        <p style="margin: 12px 0 0 0;"><strong>📅 Payment Date:</strong> {{payment.date}}</p>
        <p style="margin: 12px 0 0 0;"><strong>💳 Payment Method:</strong> {{payment.method}}</p>
        <p style="margin: 12px 0 0 0;"><strong>🔖 Confirmation #:</strong> {{payment.confirmationNumber}}</p>
      </div>

      <p>A receipt has been sent to your email. You can also view your receipt online:</p>

      <div style="margin: 32px 0;">
        <a class="not-prose" href="{{payment.receiptUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">📄 View Receipt</a>
      </div>

      <p>Thank you for your business!</p>
      <p>{{business.name}}</p>
    `,
    description: "Sent when a payment is successfully processed",
  },
};

async function seedSystemTemplates(tenantId) {
  const created = [];
  const updated = [];
  const skipped = [];

  for (const [key, template] of Object.entries(SYSTEM_TEMPLATES)) {
    // Check if template already exists
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        systemKey: key,
      },
    });

    if (existing) {
      // If existing template doesn't have isSystem flag, update it
      if (!existing.isSystem) {
        await prisma.emailTemplate.update({
          where: { id: existing.id },
          data: { isSystem: true },
        });
        updated.push(key);
      } else {
        skipped.push(key);
      }
      continue;
    }

    // Create the system template
    await prisma.emailTemplate.create({
      data: {
        tenantId,
        systemKey: key,
        isSystem: true,
        name: template.name,
        subject: template.subject,
        body: template.body,
        description: template.description,
        category: template.category,
      },
    });

    created.push(key);
  }

  return { created, updated, skipped };
}

async function main() {
  console.log("🌱 Seeding system email templates...\n");

  // Get all tenants
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      businessName: true,
    },
  });

  console.log(`Found ${tenants.length} tenant(s)\n`);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  // Seed templates for each tenant
  for (const tenant of tenants) {
    const displayName = tenant.businessName || tenant.name || tenant.id;
    console.log(`📧 Seeding templates for: ${displayName}`);

    const { created, updated, skipped } = await seedSystemTemplates(tenant.id);

    totalCreated += created.length;
    totalUpdated += updated.length;
    totalSkipped += skipped.length;

    if (created.length > 0) {
      console.log(`   ✅ Created ${created.length} template(s): ${created.join(", ")}`);
    }
    if (updated.length > 0) {
      console.log(`   🔄 Updated ${updated.length} template(s): ${updated.join(", ")}`);
    }
    if (skipped.length > 0) {
      console.log(`   ⏭️  Skipped ${skipped.length} (already exist): ${skipped.join(", ")}`);
    }
    console.log();
  }

  console.log("━".repeat(60));
  console.log(`✨ Done! Created ${totalCreated} templates across ${tenants.length} tenant(s)`);
  if (totalUpdated > 0) {
    console.log(`   (Updated ${totalUpdated} templates with isSystem flag)`);
  }
  if (totalSkipped > 0) {
    console.log(`   (Skipped ${totalSkipped} templates that already existed)`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Error seeding system templates:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
