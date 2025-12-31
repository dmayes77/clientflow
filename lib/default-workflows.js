/**
 * Default Workflows Configuration
 * These workflows are created automatically for every tenant and provide
 * out-of-the-box automation for common business processes.
 *
 * Trigger types:
 * - Event-based: lead_created, client_converted, payment_received
 * - Tag-based: invoice_tag_added, booking_tag_added (require triggerTagName)
 *
 * For tag-based triggers, the workflow only fires when that specific status
 * tag is applied. This allows the tag system to drive all automation.
 */

/**
 * Default workflows that will be created for new tenants
 * Each workflow references system email templates by their systemKey
 */
export const DEFAULT_WORKFLOWS = [
  // ============================================================================
  // INVOICE WORKFLOWS (Event-based)
  // Events trigger workflows → Workflows apply tags AND send emails
  // ============================================================================
  {
    systemKey: "invoice_sent_workflow",
    name: "Invoice Sent",
    description: "Apply 'Sent' tag and send invoice email when invoice is sent",
    triggerType: "invoice_sent",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_invoice",
        config: { tagName: "Sent", tagType: "invoice" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "invoice_sent" },
      },
    ],
  },
  {
    systemKey: "invoice_paid_workflow",
    name: "Invoice Paid",
    description: "Apply 'Paid' tag and send confirmation when invoice is paid in full",
    triggerType: "invoice_paid",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_invoice",
        config: { tagName: "Paid", tagType: "invoice" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "payment_received" },
      },
    ],
  },
  {
    systemKey: "invoice_deposit_paid_workflow",
    name: "Invoice Deposit Paid",
    description: "Apply 'Deposit Paid' tag and send confirmation when deposit is received",
    triggerType: "invoice_deposit_paid",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_invoice",
        config: { tagName: "Deposit Paid", tagType: "invoice" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "deposit_paid" },
      },
    ],
  },

  // ============================================================================
  // BOOKING WORKFLOWS (Event-based)
  // Events trigger workflows → Workflows apply tags AND send emails
  // ============================================================================
  {
    systemKey: "booking_scheduled_workflow",
    name: "Booking Scheduled",
    description: "Apply 'Scheduled' tag and send confirmation when deposit is paid",
    triggerType: "booking_scheduled",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "Scheduled", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_scheduled" },
      },
    ],
  },
  {
    systemKey: "booking_confirmed_workflow",
    name: "Booking Confirmed",
    description: "Apply 'Confirmed' tag and send notification when booking is confirmed",
    triggerType: "booking_confirmed",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "Confirmed", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_confirmed" },
      },
    ],
  },
  {
    systemKey: "booking_cancelled_workflow",
    name: "Booking Cancelled",
    description: "Apply 'Cancelled' tag and send confirmation when booking is cancelled",
    triggerType: "booking_cancelled",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "Cancelled", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_cancelled" },
      },
    ],
  },

  // ============================================================================
  // CONTACT/LEAD WORKFLOWS (Event-based)
  // ============================================================================
  {
    systemKey: "lead_welcome_email",
    name: "Welcome New Lead",
    description: "Send a welcome email when a new lead is created",
    triggerType: "lead_created",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "send_email",
        config: { systemTemplateKey: "lead_welcome" },
      },
      {
        type: "add_tag",
        config: { tagName: "Lead" },
      },
    ],
  },
  {
    systemKey: "client_converted_email",
    name: "Convert Lead to Client",
    description: "Update tags and send welcome email when lead becomes a client",
    triggerType: "client_converted",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "remove_tag",
        config: { tagName: "Lead" },
      },
      {
        type: "add_tag",
        config: { tagName: "Client" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "client_welcome" },
      },
    ],
  },
  {
    systemKey: "contact_converted_workflow",
    name: "Contact Converted to Active",
    description: "Update tags and send welcome email when contact status changes to active",
    triggerType: "contact_converted",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "remove_tag",
        config: { tagName: "Lead" },
      },
      {
        type: "add_tag",
        config: { tagName: "Client" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "client_welcome" },
      },
    ],
  },

  // ============================================================================
  // PAYMENT WORKFLOWS (Event-based)
  // ============================================================================
  {
    systemKey: "payment_received_email",
    name: "Payment Received Thank You",
    description: "Apply Succeeded tag and send thank you email when a payment is received",
    triggerType: "payment_received",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_payment",
        config: { tagName: "Succeeded", tagType: "payment" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "payment_received" },
      },
    ],
  },
  {
    systemKey: "payment_failed_workflow",
    name: "Payment Failed Notification",
    description: "Apply Failed tag and notify contact when a payment fails",
    triggerType: "payment_failed",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_payment",
        config: { tagName: "Failed", tagType: "payment" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "payment_failed" },
      },
    ],
  },
  {
    systemKey: "invoice_refunded_workflow",
    name: "Invoice Refunded",
    description: "Apply Refunded tag and send refund confirmation when an invoice is refunded",
    triggerType: "invoice_refunded",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_payment",
        config: { tagName: "Refunded", tagType: "payment" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "invoice_refunded" },
      },
    ],
  },

  // ============================================================================
  // ADDITIONAL BOOKING WORKFLOWS (Event-based)
  // ============================================================================
  {
    systemKey: "booking_created_workflow",
    name: "Booking Request Received",
    description: "Apply 'Pending' tag and send confirmation when a booking is created",
    triggerType: "booking_created",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "Pending", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_created" },
      },
    ],
  },
  {
    systemKey: "booking_completed_workflow",
    name: "Booking Completed",
    description: "Apply 'Completed' tag and send thank you when booking is completed",
    triggerType: "booking_completed",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "Completed", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_completed" },
      },
    ],
  },
  {
    systemKey: "booking_no_show_workflow",
    name: "Booking No-Show",
    description: "Apply 'No Show' tag and send notification when contact misses appointment",
    triggerType: "booking_no_show",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_booking",
        config: { tagName: "No Show", tagType: "booking" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "booking_no_show" },
      },
    ],
  },

  // ============================================================================
  // INVOICE STATUS WORKFLOWS (Event-based)
  // ============================================================================
  {
    systemKey: "invoice_overdue_workflow",
    name: "Invoice Overdue",
    description: "Apply 'Overdue' tag and send notification when invoice becomes overdue",
    triggerType: "invoice_overdue",
    delayMinutes: 0,
    active: true,
    actions: [
      {
        type: "add_tag_to_invoice",
        config: { tagName: "Overdue", tagType: "invoice" },
      },
      {
        type: "send_email",
        config: { systemTemplateKey: "invoice_overdue" },
      },
    ],
  },
];

/**
 * Create default workflows for a tenant
 * @param {object} prisma - Prisma client instance
 * @param {string} tenantId - The tenant ID
 */
export async function createDefaultWorkflowsForTenant(prisma, tenantId) {
  console.log(`[default-workflows] Creating default workflows for tenant ${tenantId}`);

  // Get all email templates for this tenant to resolve systemTemplateKey references
  const emailTemplates = await prisma.emailTemplate.findMany({
    where: { tenantId },
    select: { id: true, systemKey: true, name: true },
  });

  // Get all tags for this tenant to resolve tagName references and triggerTagName
  const tags = await prisma.tag.findMany({
    where: { tenantId },
    select: { id: true, name: true, type: true },
  });

  const templateByKey = {};
  emailTemplates.forEach((t) => {
    if (t.systemKey) templateByKey[t.systemKey] = t;
  });

  // Index tags by name (lowercase) for action resolution
  const tagByName = {};
  tags.forEach((t) => {
    tagByName[t.name.toLowerCase()] = t;
  });

  // Index tags by name+type for trigger resolution
  const tagByNameAndType = {};
  tags.forEach((t) => {
    const key = `${t.name.toLowerCase()}:${t.type}`;
    tagByNameAndType[key] = t;
  });

  const createdWorkflows = [];

  for (const workflowDef of DEFAULT_WORKFLOWS) {
    // Check if workflow with this systemKey already exists (preferred) or by name (fallback)
    let existing = null;
    if (workflowDef.systemKey) {
      existing = await prisma.workflow.findFirst({
        where: {
          tenantId,
          systemKey: workflowDef.systemKey,
        },
        select: { id: true, isSystem: true, actions: true },
      });
    }
    if (!existing) {
      existing = await prisma.workflow.findFirst({
        where: {
          tenantId,
          name: workflowDef.name,
        },
        select: { id: true, isSystem: true, actions: true },
      });
    }

    // Resolve trigger tag ID for tag-based workflows
    let triggerTagId = null;
    if (workflowDef.triggerTagName && workflowDef.triggerTagType) {
      const triggerKey = `${workflowDef.triggerTagName.toLowerCase()}:${workflowDef.triggerTagType}`;
      const triggerTag = tagByNameAndType[triggerKey];
      if (triggerTag) {
        triggerTagId = triggerTag.id;
      } else {
        console.warn(`[default-workflows] Trigger tag not found: ${workflowDef.triggerTagName} (${workflowDef.triggerTagType})`);
      }
    }

    // Resolve action references to actual IDs
    const resolvedActions = workflowDef.actions.map((action) => {
      const resolved = { type: action.type, config: { ...action.config } };

      // Resolve email template references
      if (action.config.systemTemplateKey) {
        const template = templateByKey[action.config.systemTemplateKey];
        if (template) {
          resolved.config.templateId = template.id;
          delete resolved.config.systemTemplateKey;
        } else {
          console.warn(`[default-workflows] Template not found: ${action.config.systemTemplateKey}`);
          resolved.config.templateId = null;
        }
      }

      // Resolve tag references in actions
      if (action.config.tagName) {
        let tag = null;
        // If tagType is specified, use name+type lookup for accuracy
        if (action.config.tagType) {
          const key = `${action.config.tagName.toLowerCase()}:${action.config.tagType}`;
          tag = tagByNameAndType[key];
        } else {
          // Fallback to name-only lookup
          tag = tagByName[action.config.tagName.toLowerCase()];
        }

        if (tag) {
          resolved.config.tagId = tag.id;
          delete resolved.config.tagName;
          delete resolved.config.tagType;
        } else {
          console.warn(`[default-workflows] Tag not found: ${action.config.tagName}${action.config.tagType ? ` (${action.config.tagType})` : ""}`);
          resolved.config.tagId = null;
        }
      }

      return resolved;
    });

    try {
      if (existing) {
        // Update existing system workflow if it has empty actions or needs trigger tag
        const needsUpdate = existing.isSystem && (
          (!existing.actions || existing.actions.length === 0) ||
          (workflowDef.triggerTagName && triggerTagId)
        );
        if (needsUpdate) {
          await prisma.workflow.update({
            where: { id: existing.id },
            data: {
              actions: resolvedActions,
              triggerTagId,
              systemKey: workflowDef.systemKey || null,
            },
          });
          console.log(`[default-workflows] Updated "${workflowDef.name}" with actions and trigger tag`);
        } else {
          console.log(`[default-workflows] Skipping "${workflowDef.name}" - already exists`);
        }
        continue;
      }

      const workflow = await prisma.workflow.create({
        data: {
          tenantId,
          name: workflowDef.name,
          description: workflowDef.description,
          triggerType: workflowDef.triggerType,
          triggerTagId,
          systemKey: workflowDef.systemKey || null,
          delayMinutes: workflowDef.delayMinutes,
          active: workflowDef.active,
          isSystem: true, // System workflows cannot be deleted, only paused/edited
          actions: resolvedActions,
        },
      });

      createdWorkflows.push(workflow);
      console.log(`[default-workflows] Created "${workflowDef.name}"`);
    } catch (error) {
      console.error(`[default-workflows] Failed to create "${workflowDef.name}":`, error.message);
    }
  }

  return createdWorkflows;
}
