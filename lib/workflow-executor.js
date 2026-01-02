import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";

/**
 * Build template variables from context data
 */
function buildTemplateVariables({ contact, booking, tenant, invoice, payment, tag }) {
  const variables = {};

  // Contact variables - use contact relation, or fall back to invoice/booking contact info
  if (contact) {
    const nameParts = contact.name?.split(" ") || [];
    variables.contact = {
      name: contact.name || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: contact.email || "",
      phone: contact.phone || "",
    };
  } else if (invoice?.contactName || invoice?.contactEmail) {
    // Fallback to invoice contact info when no contact relation
    const nameParts = invoice.contactName?.split(" ") || [];
    variables.contact = {
      name: invoice.contactName || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: invoice.contactEmail || "",
      phone: invoice.contactPhone || "",
    };
  } else if (booking?.contactName || booking?.contactEmail) {
    // Fallback to booking contact info when no contact relation
    const nameParts = booking.contactName?.split(" ") || [];
    variables.contact = {
      name: booking.contactName || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: booking.contactEmail || "",
      phone: booking.contactPhone || "",
    };
  }

  // Booking variables
  if (booking) {
    const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : null;
    variables.booking = {
      service: booking.service?.name || booking.package?.name || "Service",
      date: scheduledDate
        ? scheduledDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      time: scheduledDate
        ? scheduledDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      duration: booking.duration ? `${booking.duration} minutes` : "",
      price: booking.totalPrice
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(booking.totalPrice / 100)
        : "",
      confirmationNumber: booking.id?.slice(-8).toUpperCase() || "",
      status: booking.status || "",
      notes: booking.notes || "",
      rescheduleUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reschedule/${booking.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cancel/${booking.id}`,
    };
  }

  // Business/Tenant variables
  if (tenant) {
    variables.business = {
      name: tenant.businessName || tenant.name || "",
      email: tenant.email || "",
      phone: tenant.businessPhone || "",
      address: [
        tenant.businessAddress,
        tenant.businessCity,
        tenant.businessState,
        tenant.businessZip,
      ]
        .filter(Boolean)
        .join(", "),
      website: tenant.businessWebsite || "",
    };
  }

  // Invoice variables
  if (invoice) {
    variables.invoice = {
      number: invoice.invoiceNumber || invoice.id?.slice(-8).toUpperCase() || "",
      amount: invoice.total
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(invoice.total / 100)
        : "",
      subtotal: invoice.subtotal
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(invoice.subtotal / 100)
        : "",
      balanceDue: invoice.balanceDue
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(invoice.balanceDue / 100)
        : "",
      paidDate: invoice.paidAt
        ? new Date(invoice.paidAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      dueDate: invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      issueDate: invoice.issueDate
        ? new Date(invoice.issueDate).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      pdfUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/pdf`,
      paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.id}`,
    };
  }

  // Payment variables
  if (payment) {
    variables.payment = {
      amount: payment.amount
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(payment.amount / 100)
        : "",
      date: payment.createdAt
        ? new Date(payment.createdAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "",
      method: payment.cardBrand
        ? `${payment.cardBrand.charAt(0).toUpperCase() + payment.cardBrand.slice(1)} ****${payment.cardLast4}`
        : "Card",
      receiptUrl: payment.stripeReceiptUrl || "",
      confirmationNumber: payment.id?.slice(-8).toUpperCase() || "",
    };
  }

  // Tag variables (for tag-based triggers)
  if (tag) {
    variables.tag = {
      name: tag.name || "",
      type: tag.type || "",
      description: tag.description || "",
    };
  }

  return variables;
}

/**
 * Execute a single workflow action
 */
async function executeAction(action, context) {
  const { type, config } = action;
  const { contact, booking, tenant, invoice, payment } = context;

  switch (type) {
    case "send_email": {
      // Get recipient email - prefer contact, fallback to invoice/booking contactEmail
      const recipientEmail = contact?.email || invoice?.contactEmail || booking?.contactEmail;

      if (!config.templateId) {
        console.error("[workflow] send_email: Missing templateId in action config");
        return { success: false, error: "Missing email template configuration" };
      }

      if (!recipientEmail) {
        console.error("[workflow] send_email: No recipient email found", {
          contactEmail: contact?.email,
          invoiceContactEmail: invoice?.contactEmail,
          bookingContactEmail: booking?.contactEmail,
        });
        return { success: false, error: "No recipient email address found" };
      }

      // Fetch the email template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: config.templateId },
      });

      if (!template) {
        console.error(`[workflow] send_email: Template not found (ID: ${config.templateId})`);
        return { success: false, error: "Email template not found" };
      }

      console.log(`[workflow] send_email: Sending "${template.name}" to ${recipientEmail}`);

      const variables = buildTemplateVariables(context);

      const result = await sendTemplatedEmail({
        to: recipientEmail,
        subject: template.subject,
        body: template.body,
        variables,
      });

      return result;
    }

    case "add_tag": {
      if (!config.tagId || !contact?.id) {
        console.error("[workflow] add_tag: Missing tag or contact", { tagId: config.tagId, contactId: contact?.id });
        return { success: false, error: "Missing tag or contact" };
      }

      // Check if tag already exists on contact
      const existingTag = await prisma.contactTag.findFirst({
        where: {
          contactId: contact.id,
          tagId: config.tagId,
        },
      });

      if (existingTag) {
        console.log(`[workflow] add_tag: Tag ${config.tagId} already exists on contact ${contact.id}`);
        return { success: true, message: "Tag already exists on contact" };
      }

      await prisma.contactTag.create({
        data: {
          contactId: contact.id,
          tagId: config.tagId,
        },
      });

      console.log(`[workflow] add_tag: Added tag ${config.tagId} to contact ${contact.id}`);
      return { success: true };
    }

    case "remove_tag": {
      if (!config.tagId || !contact?.id) {
        return { success: false, error: "Missing tag or contact" };
      }

      await prisma.contactTag.deleteMany({
        where: {
          contactId: contact.id,
          tagId: config.tagId,
        },
      });

      return { success: true };
    }

    case "add_tag_to_invoice": {
      if (!config.tagId || !invoice?.id) {
        console.error("[workflow] add_tag_to_invoice: Missing tag or invoice", { tagId: config.tagId, invoiceId: invoice?.id });
        return { success: false, error: "Missing tag or invoice" };
      }

      // Check if tag already exists
      const existingTag = await prisma.invoiceTag.findFirst({
        where: {
          invoiceId: invoice.id,
          tagId: config.tagId,
        },
      });

      if (existingTag) {
        console.log(`[workflow] add_tag_to_invoice: Tag ${config.tagId} already exists on invoice ${invoice.id}`);
        return { success: true, message: "Tag already exists on invoice" };
      }

      await prisma.invoiceTag.create({
        data: {
          invoiceId: invoice.id,
          tagId: config.tagId,
        },
      });

      console.log(`[workflow] add_tag_to_invoice: Added tag ${config.tagId} to invoice ${invoice.id}`);
      return { success: true };
    }

    case "remove_tag_from_invoice": {
      if (!config.tagId || !invoice?.id) {
        return { success: false, error: "Missing tag or invoice" };
      }

      await prisma.invoiceTag.deleteMany({
        where: {
          invoiceId: invoice.id,
          tagId: config.tagId,
        },
      });

      return { success: true };
    }

    case "add_tag_to_booking": {
      if (!config.tagId || !booking?.id) {
        console.error("[workflow] add_tag_to_booking: Missing tag or booking", { tagId: config.tagId, bookingId: booking?.id });
        return { success: false, error: "Missing tag or booking" };
      }

      // Check if tag already exists
      const existingTag = await prisma.bookingTag.findFirst({
        where: {
          bookingId: booking.id,
          tagId: config.tagId,
        },
      });

      if (existingTag) {
        console.log(`[workflow] add_tag_to_booking: Tag ${config.tagId} already exists on booking ${booking.id}`);
        return { success: true, message: "Tag already exists on booking" };
      }

      await prisma.bookingTag.create({
        data: {
          bookingId: booking.id,
          tagId: config.tagId,
        },
      });

      console.log(`[workflow] add_tag_to_booking: Added tag ${config.tagId} to booking ${booking.id}`);
      return { success: true };
    }

    case "remove_tag_from_booking": {
      if (!config.tagId || !booking?.id) {
        return { success: false, error: "Missing tag or booking" };
      }

      await prisma.bookingTag.deleteMany({
        where: {
          bookingId: booking.id,
          tagId: config.tagId,
        },
      });

      return { success: true };
    }

    case "add_tag_to_payment": {
      if (!config.tagId || !payment?.id) {
        return { success: false, error: "Missing tag or payment" };
      }

      // Check if tag already exists
      const existingTag = await prisma.paymentTag.findFirst({
        where: {
          paymentId: payment.id,
          tagId: config.tagId,
        },
      });

      if (existingTag) {
        return { success: true, message: "Tag already exists on payment" };
      }

      await prisma.paymentTag.create({
        data: {
          paymentId: payment.id,
          tagId: config.tagId,
        },
      });

      return { success: true };
    }

    case "remove_tag_from_payment": {
      if (!config.tagId || !payment?.id) {
        return { success: false, error: "Missing tag or payment" };
      }

      await prisma.paymentTag.deleteMany({
        where: {
          paymentId: payment.id,
          tagId: config.tagId,
        },
      });

      return { success: true };
    }

    case "update_status": {
      if (!config.status || !contact?.id) {
        return { success: false, error: "Missing status or contact" };
      }

      await prisma.contact.update({
        where: { id: contact.id },
        data: { status: config.status },
      });

      return { success: true };
    }

    case "create_invoice": {
      if (!booking?.id || !tenant?.id) {
        console.error("[workflow] create_invoice: Missing booking or tenant", {
          bookingId: booking?.id,
          tenantId: tenant?.id,
        });
        return { success: false, error: "Missing booking or tenant" };
      }

      // Check if invoice already exists for this booking
      const existingInvoice = await prisma.invoice.findFirst({
        where: { bookingId: booking.id },
      });

      if (existingInvoice) {
        console.log(`[workflow] create_invoice: Invoice already exists for booking ${booking.id}`);
        return { success: true, message: "Invoice already exists", invoiceId: existingInvoice.id };
      }

      // Calculate due date
      const dueInDays = config.dueInDays || 30;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + dueInDays);

      // Build line items
      const lineItems = [];
      if (config.includeBookingTotal !== false && booking.totalPrice) {
        lineItems.push({
          description: booking.service?.name || booking.package?.name || "Service",
          quantity: 1,
          unitPrice: booking.totalPrice,
          total: booking.totalPrice,
        });
      }

      const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);

      // Create the invoice
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          contactId: contact?.id || null,
          bookingId: booking.id,
          contactName: contact?.name || booking.contactName || "",
          contactEmail: contact?.email || booking.contactEmail || "",
          contactPhone: contact?.phone || booking.contactPhone || "",
          status: "draft",
          issueDate: new Date(),
          dueDate,
          lineItems,
          subtotal,
          total: subtotal,
          balanceDue: subtotal,
        },
      });

      console.log(`[workflow] create_invoice: Created invoice ${invoice.id} for booking ${booking.id}`);
      return { success: true, invoiceId: invoice.id };
    }

    case "update_booking_status": {
      if (!config.status || !booking?.id) {
        console.error("[workflow] update_booking_status: Missing status or booking", {
          status: config.status,
          bookingId: booking?.id,
        });
        return { success: false, error: "Missing status or booking" };
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: config.status },
      });

      console.log(`[workflow] update_booking_status: Updated booking ${booking.id} to status ${config.status}`);
      return { success: true };
    }

    case "webhook": {
      if (!config.url) {
        console.error("[workflow] webhook: Missing URL");
        return { success: false, error: "Missing webhook URL" };
      }

      try {
        const method = config.method || "POST";
        const headers = { "Content-Type": "application/json" };

        let body = null;
        if (method !== "GET" && config.includePayload !== false) {
          // Build payload with context data
          body = JSON.stringify({
            event: "workflow_triggered",
            timestamp: new Date().toISOString(),
            contact: contact ? {
              id: contact.id,
              name: contact.name,
              email: contact.email,
              phone: contact.phone,
              status: contact.status,
            } : null,
            booking: booking ? {
              id: booking.id,
              status: booking.status,
              scheduledAt: booking.scheduledAt,
              totalPrice: booking.totalPrice,
              serviceName: booking.service?.name || booking.package?.name,
            } : null,
            invoice: invoice ? {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              total: invoice.total,
              balanceDue: invoice.balanceDue,
            } : null,
            payment: payment ? {
              id: payment.id,
              amount: payment.amount,
              status: payment.status,
            } : null,
          });
        }

        const response = await fetch(config.url, {
          method,
          headers,
          body,
        });

        if (!response.ok) {
          console.error(`[workflow] webhook: Request failed with status ${response.status}`);
          return { success: false, error: `Webhook returned ${response.status}` };
        }

        console.log(`[workflow] webhook: Successfully called ${config.url}`);
        return { success: true, statusCode: response.status };
      } catch (error) {
        console.error("[workflow] webhook: Request error", error);
        return { success: false, error: error.message };
      }
    }

    case "send_notification": {
      // Send notification to business owner
      if (!tenant?.email) {
        return { success: false, error: "Missing tenant email" };
      }

      const variables = buildTemplateVariables(context);
      const message = config.message || "You have a new notification";

      await sendTemplatedEmail({
        to: tenant.email,
        subject: config.subject || "Notification from ClientFlow",
        body: `<p>${message}</p>`,
        variables,
      });

      return { success: true };
    }

    case "wait": {
      // Wait actions are handled by the delay scheduling, not executed directly
      return { success: true, message: "Wait action - delay already scheduled" };
    }

    default:
      return { success: false, error: `Unknown action type: ${type}` };
  }
}

/**
 * Execute a workflow with all its actions
 */
async function executeWorkflow(workflow, context) {
  const actions = workflow.actions || [];
  const results = [];

  // Create a workflow run record
  const run = await prisma.workflowRun.create({
    data: {
      workflowId: workflow.id,
      contactId: context.contact?.id,
      status: "running",
    },
  });

  try {
    for (const action of actions) {
      console.log(`[workflow] Executing action "${action.type}" for workflow "${workflow.name}"`, action.config);
      const result = await executeAction(action, context);
      results.push({ action: action.type, ...result });

      if (!result.success) {
        console.error(`[workflow] Action failed: ${action.type}`, result.error);
      } else {
        console.log(`[workflow] Action succeeded: ${action.type}`, result.message || "");
      }
    }

    // Mark workflow run as completed
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "completed",
        result: results,
        completedAt: new Date(),
      },
    });

    return { success: true, runId: run.id, results };
  } catch (error) {
    // Mark workflow run as failed
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      },
    });

    return { success: false, runId: run.id, error: error.message };
  }
}

/**
 * Find and execute all active workflows for a given trigger
 * @param {string} triggerType - The type of trigger (booking_created, lead_created, tag_added, etc.)
 * @param {Object} context - Context data including contact, booking, tenant, tag
 */
export async function triggerWorkflows(triggerType, context) {
  const { tenant, tag, contact, invoice, booking, payment } = context;

  console.log(`[workflow] Triggering "${triggerType}" for tenant ${tenant?.id}`, {
    hasContact: !!contact,
    hasInvoice: !!invoice,
    hasBooking: !!booking,
    hasPayment: !!payment,
    hasTag: !!tag,
  });

  if (!tenant?.id) {
    console.error("[workflow] No tenant provided for workflow trigger");
    return { success: false, error: "No tenant provided" };
  }

  // Build where clause - for tag-based triggers, also filter by triggerTagId
  const whereClause = {
    tenantId: tenant.id,
    triggerType,
    active: true,
  };

  // For tag-based triggers, only match workflows configured for this specific tag
  // or workflows with no specific tag (triggerTagId is null = any tag of this type)
  if (tag?.id && triggerType.includes("tag_")) {
    whereClause.OR = [
      { triggerTagId: tag.id },
      { triggerTagId: null },
    ];
  }

  // Find all active workflows for this trigger type and tenant
  const workflows = await prisma.workflow.findMany({
    where: whereClause,
  });

  console.log(`[workflow] Found ${workflows.length} active workflow(s) for "${triggerType}"`);

  if (workflows.length === 0) {
    console.log(`[workflow] No workflows to execute for "${triggerType}"`);
    return { success: true, message: "No workflows to execute", executed: 0 };
  }

  const results = [];

  for (const workflow of workflows) {
    // Check if there's a delay
    if (workflow.delayMinutes > 0) {
      // Schedule for delayed execution
      const scheduledFor = new Date(Date.now() + workflow.delayMinutes * 60 * 1000);

      // Create a pending workflow run for later execution
      const run = await prisma.workflowRun.create({
        data: {
          workflowId: workflow.id,
          contactId: context.contact?.id,
          status: "pending",
          result: {
            scheduledFor: scheduledFor.toISOString(),
            context: {
              contactId: context.contact?.id,
              bookingId: context.booking?.id,
              invoiceId: context.invoice?.id,
              paymentId: context.payment?.id,
              tagId: context.tag?.id,
              tenantId: tenant.id,
            },
          },
        },
      });

      results.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        scheduled: true,
        scheduledFor,
        runId: run.id,
      });
    } else {
      // Execute immediately
      const result = await executeWorkflow(workflow, context);
      results.push({
        workflowId: workflow.id,
        workflowName: workflow.name,
        ...result,
      });
    }
  }

  return {
    success: true,
    executed: results.filter((r) => !r.scheduled).length,
    scheduled: results.filter((r) => r.scheduled).length,
    results,
  };
}

/**
 * Process pending workflow runs that are ready to execute
 * This should be called by a cron job or scheduled task
 */
export async function processPendingWorkflows() {
  const now = new Date();

  // Find pending runs that are ready to execute
  const pendingRuns = await prisma.workflowRun.findMany({
    where: {
      status: "pending",
    },
    include: {
      workflow: true,
    },
  });

  const results = [];

  for (const run of pendingRuns) {
    const scheduledFor = run.result?.scheduledFor
      ? new Date(run.result.scheduledFor)
      : null;

    // Skip if not yet ready
    if (scheduledFor && scheduledFor > now) {
      continue;
    }

    // Reconstruct context from stored data
    const contextData = run.result?.context || {};

    // Fetch required data
    const [contact, booking, invoice, payment, tag, tenant] = await Promise.all([
      contextData.contactId
        ? prisma.contact.findUnique({ where: { id: contextData.contactId } })
        : null,
      contextData.bookingId
        ? prisma.booking.findUnique({
            where: { id: contextData.bookingId },
            include: { service: true, package: true },
          })
        : null,
      contextData.invoiceId
        ? prisma.invoice.findUnique({ where: { id: contextData.invoiceId } })
        : null,
      contextData.paymentId
        ? prisma.payment.findUnique({ where: { id: contextData.paymentId } })
        : null,
      contextData.tagId
        ? prisma.tag.findUnique({ where: { id: contextData.tagId } })
        : null,
      contextData.tenantId
        ? prisma.tenant.findUnique({ where: { id: contextData.tenantId } })
        : null,
    ]);

    const context = { contact, booking, invoice, payment, tag, tenant };

    // Update run status to running
    await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: "running" },
    });

    try {
      // Execute each action
      const actions = run.workflow.actions || [];
      const actionResults = [];

      for (const action of actions) {
        const result = await executeAction(action, context);
        actionResults.push({ action: action.type, ...result });
      }

      // Mark as completed
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "completed",
          result: actionResults,
          completedAt: new Date(),
        },
      });

      results.push({ runId: run.id, success: true, results: actionResults });
    } catch (error) {
      // Mark as failed
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: "failed",
          error: error.message,
          completedAt: new Date(),
        },
      });

      results.push({ runId: run.id, success: false, error: error.message });
    }
  }

  return { processed: results.length, results };
}
