/**
 * Refresh system data for all tenants
 * This script ensures all tenants have the latest:
 * - System tags (like "Scheduled" for bookings)
 * - System email templates
 * - Default workflows
 *
 * Run with: node scripts/refresh-system-tags.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// SYSTEM TAGS (copied from lib/system-tags.js to avoid import issues)
// ============================================================================

const INVOICE_STATUS_TAGS = [
  { name: "Draft", color: "gray", description: "Invoice has been created but not yet sent", type: "invoice" },
  { name: "Sent", color: "blue", description: "Invoice has been sent to the client", type: "invoice" },
  { name: "Viewed", color: "indigo", description: "Client has viewed the invoice", type: "invoice" },
  { name: "Paid", color: "green", description: "Invoice has been paid", type: "invoice" },
  { name: "Overdue", color: "red", description: "Invoice is past due date", type: "invoice" },
  { name: "Cancelled", color: "gray", description: "Invoice has been cancelled", type: "invoice" },
];

const BOOKING_STATUS_TAGS = [
  { name: "Pending", color: "yellow", description: "Booking created, awaiting payment", type: "booking" },
  { name: "Scheduled", color: "blue", description: "Deposit paid, awaiting client confirmation", type: "booking" },
  { name: "Confirmed", color: "green", description: "Client has confirmed attendance", type: "booking" },
  { name: "Completed", color: "blue", description: "Booking has been completed", type: "booking" },
  { name: "Cancelled", color: "red", description: "Booking has been cancelled", type: "booking" },
  { name: "No Show", color: "gray", description: "Client did not show up", type: "booking" },
];

const CONTACT_STATUS_TAGS = [
  { name: "Lead", color: "yellow", description: "New potential client", type: "contact" },
  { name: "Client", color: "green", description: "Active client", type: "contact" },
  { name: "Inactive", color: "gray", description: "Inactive contact", type: "contact" },
];

const ALL_SYSTEM_TAGS = [...INVOICE_STATUS_TAGS, ...BOOKING_STATUS_TAGS, ...CONTACT_STATUS_TAGS];

// ============================================================================
// SYSTEM EMAIL TEMPLATES (copied from lib/system-templates.js)
// ============================================================================

const SYSTEM_TEMPLATES = {
  payment_reminder_gentle: {
    name: "Payment Reminder - Gentle",
    category: "payment",
    subject: "Friendly Reminder: Invoice {{invoice.number}} Due",
    body: `<h2>Hi {{contact.firstName}},</h2><p>Just a friendly reminder that invoice <strong>{{invoice.number}}</strong> for <strong>{{invoice.amount}}</strong> is now due.</p><div style="margin: 32px 0;"><a href="{{invoice.paymentUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Invoice</a></div><p>Best regards,<br>{{business.name}}</p>`,
    description: "Sent when invoice is 1-7 days overdue",
  },
  payment_reminder_urgent: {
    name: "Payment Reminder - Urgent",
    category: "payment",
    subject: "Urgent: Invoice {{invoice.number}} Past Due",
    body: `<h2>Hi {{contact.firstName}},</h2><p>This is an urgent reminder that invoice <strong>{{invoice.number}}</strong> is past due.</p><div style="margin: 32px 0;"><a href="{{invoice.paymentUrl}}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Pay Now</a></div><p>{{business.name}}</p>`,
    description: "Sent when invoice is 8-14 days overdue",
  },
  payment_reminder_final: {
    name: "Payment Reminder - Final Notice",
    category: "payment",
    subject: "Final Notice: Invoice {{invoice.number}} - Action Required",
    body: `<div style="background-color: #7f1d1d; color: white; padding: 16px; text-align: center;"><h2 style="margin: 0; color: white;">FINAL NOTICE</h2></div><p>Dear {{contact.name}},</p><p>Invoice <strong>{{invoice.number}}</strong> is significantly past due. Immediate payment is required.</p><div style="margin: 32px 0;"><a href="{{invoice.paymentUrl}}" style="background-color: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px;">Pay Immediately</a></div>`,
    description: "Sent when invoice is 15+ days overdue",
  },
  booking_scheduled: {
    name: "Booking Scheduled - Confirm Your Appointment",
    category: "booking",
    subject: "Please Confirm: {{booking.service}} on {{booking.date}}",
    body: `<h2>Your Booking is Scheduled!</h2><p>Hi {{contact.firstName}},</p><p>Thank you for your deposit! Please confirm your appointment:</p><div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0;"><p><strong>{{booking.service}}</strong></p><p><strong>Date:</strong> {{booking.date}}</p><p><strong>Time:</strong> {{booking.time}}</p></div><div style="margin: 32px 0; text-align: center;"><a href="{{booking.confirmUrl}}" style="background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px;">Confirm Booking</a></div><p><a href="{{booking.rescheduleUrl}}">Reschedule</a> | <a href="{{booking.cancelUrl}}">Cancel</a></p>`,
    description: "Sent when deposit is paid",
  },
  booking_confirmed: {
    name: "Booking Confirmation",
    category: "booking",
    subject: "Booking Confirmed - {{booking.service}} on {{booking.date}}",
    body: `<h2 style="color: #22c55e;">Your Booking is Confirmed!</h2><p>Hi {{contact.firstName}},</p><p>Your booking has been confirmed:</p><div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px;"><p><strong>{{booking.service}}</strong></p><p><strong>Date:</strong> {{booking.date}}</p><p><strong>Time:</strong> {{booking.time}}</p></div><p>We look forward to seeing you!</p>`,
    description: "Sent when a booking is confirmed",
  },
  booking_reminder: {
    name: "Booking Reminder",
    category: "booking",
    subject: "Reminder: {{booking.service}} Tomorrow at {{booking.time}}",
    body: `<h2>Reminder: Your Appointment is Tomorrow</h2><p>Hi {{contact.firstName}},</p><div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px;"><p><strong>{{booking.service}}</strong></p><p><strong>Date:</strong> {{booking.date}}</p><p><strong>Time:</strong> {{booking.time}}</p></div><p>Please arrive 5-10 minutes early.</p>`,
    description: "Sent 24 hours before a booking",
  },
  booking_cancelled: {
    name: "Booking Cancellation Confirmation",
    category: "booking",
    subject: "Booking Cancelled - {{booking.service}}",
    body: `<h2>Booking Cancelled</h2><p>Hi {{contact.firstName}},</p><p>Your booking has been cancelled as requested.</p><div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px;"><p><strong>Service:</strong> {{booking.service}}</p><p><strong>Original Date:</strong> {{booking.date}}</p></div><p>Contact us if you have questions.</p>`,
    description: "Sent when a booking is cancelled",
  },
  lead_welcome: {
    name: "Welcome New Lead",
    category: "lead",
    subject: "Thanks for Reaching Out! - {{business.name}}",
    body: `<h2>Thanks for Getting in Touch!</h2><p>Hi {{contact.firstName}},</p><p>Thank you for your interest in {{business.name}}!</p><p>Feel free to book a consultation or reply to this email with any questions.</p><p>Best regards,<br>{{business.name}}</p>`,
    description: "Sent when a new lead is created",
  },
  client_welcome: {
    name: "Welcome New Client",
    category: "client",
    subject: "Welcome to {{business.name}}!",
    body: `<h2>Welcome to the Family!</h2><p>Hi {{contact.firstName}},</p><p>We're thrilled to have you as a client! Thank you for choosing {{business.name}}.</p><p>See you soon!</p><p>The {{business.name}} Team</p>`,
    description: "Sent when a lead converts to a paying client",
  },
  payment_received: {
    name: "Payment Confirmation",
    category: "payment",
    subject: "Payment Received - Thank You!",
    body: `<div style="background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px;"><h2 style="margin: 0; color: white;">Payment Received</h2></div><p>Hi {{contact.firstName}},</p><p>Thank you! We've received your payment of {{payment.amount}}.</p><p>{{business.name}}</p>`,
    description: "Sent when a payment is processed",
  },
};

// ============================================================================
// DEFAULT WORKFLOWS
// ============================================================================

const DEFAULT_WORKFLOWS = [
  {
    name: "Welcome New Lead",
    description: "Send a welcome email when a new lead is created",
    triggerType: "lead_created",
    delayMinutes: 0,
    active: true,
  },
  {
    name: "Booking Scheduled Confirmation",
    description: "Send confirmation email when a booking is scheduled (deposit paid)",
    triggerType: "booking_scheduled",
    delayMinutes: 0,
    active: true,
  },
  {
    name: "Booking Confirmed Notification",
    description: "Send notification when client confirms their booking",
    triggerType: "booking_confirmed",
    delayMinutes: 0,
    active: true,
  },
  {
    name: "Payment Received Thank You",
    description: "Send thank you email when payment is received",
    triggerType: "payment_received",
    delayMinutes: 0,
    active: true,
  },
  {
    name: "Booking Cancellation Notice",
    description: "Send confirmation when a booking is cancelled",
    triggerType: "booking_cancelled",
    delayMinutes: 0,
    active: true,
  },
  {
    name: "Convert Lead to Client",
    description: "Update tags when a lead makes their first booking",
    triggerType: "client_converted",
    delayMinutes: 0,
    active: true,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createSystemTagsForTenant(tenantId) {
  for (const tag of ALL_SYSTEM_TAGS) {
    await prisma.tag.upsert({
      where: { tenantId_name: { tenantId, name: tag.name } },
      update: { isSystem: true },
      create: {
        tenantId,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        type: tag.type,
        isSystem: true,
      },
    });
  }
}

async function seedSystemTemplates(tenantId) {
  let count = 0;
  for (const [key, template] of Object.entries(SYSTEM_TEMPLATES)) {
    const existing = await prisma.emailTemplate.findFirst({
      where: { tenantId, systemKey: key },
    });
    if (!existing) {
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
      count++;
    }
  }
  return count;
}

async function createDefaultWorkflowsForTenant(tenantId) {
  // First, look up email templates and tags for this tenant
  const templates = await prisma.emailTemplate.findMany({
    where: { tenantId },
    select: { id: true, systemKey: true },
  });
  const tags = await prisma.tag.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });

  const templateByKey = {};
  templates.forEach((t) => {
    if (t.systemKey) templateByKey[t.systemKey] = t.id;
  });

  const tagByName = {};
  tags.forEach((t) => {
    tagByName[t.name.toLowerCase()] = t.id;
  });

  // Define workflows with their actions
  const workflowConfigs = [
    {
      name: "Welcome New Lead",
      description: "Send a welcome email when a new lead is created",
      triggerType: "lead_created",
      actions: [
        { type: "send_email", config: { templateId: templateByKey["lead_welcome"] || null } },
        { type: "add_tag", config: { tagId: tagByName["lead"] || null } },
      ],
    },
    {
      name: "Booking Scheduled Confirmation",
      description: "Send confirmation email when a booking is scheduled (deposit paid)",
      triggerType: "booking_scheduled",
      actions: [
        { type: "send_email", config: { templateId: templateByKey["booking_scheduled"] || null } },
      ],
    },
    {
      name: "Booking Confirmed Notification",
      description: "Send notification when client confirms their booking",
      triggerType: "booking_confirmed",
      actions: [
        { type: "send_email", config: { templateId: templateByKey["booking_confirmed"] || null } },
      ],
    },
    {
      name: "Payment Received Thank You",
      description: "Send thank you email when payment is received",
      triggerType: "payment_received",
      actions: [
        { type: "send_email", config: { templateId: templateByKey["payment_received"] || null } },
      ],
    },
    {
      name: "Booking Cancellation Notice",
      description: "Send confirmation when a booking is cancelled",
      triggerType: "booking_cancelled",
      actions: [
        { type: "send_email", config: { templateId: templateByKey["booking_cancelled"] || null } },
      ],
    },
    {
      name: "Convert Lead to Client",
      description: "Update tags when a lead makes their first booking",
      triggerType: "client_converted",
      actions: [
        { type: "remove_tag", config: { tagId: tagByName["lead"] || null } },
        { type: "add_tag", config: { tagId: tagByName["client"] || null } },
        { type: "send_email", config: { templateId: templateByKey["client_welcome"] || null } },
      ],
    },
  ];

  const created = [];
  const updated = [];
  for (const wf of workflowConfigs) {
    const existing = await prisma.workflow.findFirst({
      where: { tenantId, name: wf.name },
    });
    if (!existing) {
      // Create new workflow
      const workflow = await prisma.workflow.create({
        data: {
          tenantId,
          name: wf.name,
          description: wf.description,
          triggerType: wf.triggerType,
          delayMinutes: 0,
          active: true,
          isSystem: true,
          actions: wf.actions,
        },
      });
      created.push(workflow);
    } else if (existing.isSystem && (!existing.actions || existing.actions.length === 0)) {
      // Update existing system workflow with empty actions
      const workflow = await prisma.workflow.update({
        where: { id: existing.id },
        data: { actions: wf.actions },
      });
      updated.push(workflow);
    }
  }
  return { created, updated };
}

// ============================================================================
// MAIN
// ============================================================================

async function refreshSystemData() {
  console.log("🔄 Refreshing system data for all tenants...\n");

  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true },
  });

  console.log(`Found ${tenants.length} tenant(s)\n`);

  const results = {
    tags: { success: 0, failed: 0 },
    templates: { success: 0, failed: 0 },
    workflows: { success: 0, failed: 0 },
  };

  for (const tenant of tenants) {
    console.log(`\n📦 Processing: ${tenant.name}`);

    try {
      await createSystemTagsForTenant(tenant.id);
      console.log(`   ✅ System tags refreshed`);
      results.tags.success++;
    } catch (error) {
      console.error(`   ❌ Tags failed: ${error.message}`);
      results.tags.failed++;
    }

    try {
      const count = await seedSystemTemplates(tenant.id);
      console.log(`   ✅ Email templates refreshed (${count} new)`);
      results.templates.success++;
    } catch (error) {
      console.error(`   ❌ Templates failed: ${error.message}`);
      results.templates.failed++;
    }

    try {
      const { created, updated } = await createDefaultWorkflowsForTenant(tenant.id);
      console.log(`   ✅ Default workflows refreshed (${created.length} new, ${updated.length} updated)`);
      results.workflows.success++;
    } catch (error) {
      console.error(`   ❌ Workflows failed: ${error.message}`);
      results.workflows.failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary:");
  console.log(`   Tags:      ${results.tags.success} success, ${results.tags.failed} failed`);
  console.log(`   Templates: ${results.templates.success} success, ${results.templates.failed} failed`);
  console.log(`   Workflows: ${results.workflows.success} success, ${results.workflows.failed} failed`);
  console.log("\n✨ Done!\n");
}

refreshSystemData()
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
