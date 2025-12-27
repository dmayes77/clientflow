import { prisma } from "@/lib/prisma";
import { sendTemplatedEmail } from "@/lib/email";

/**
 * Build template variables from context data
 */
function buildTemplateVariables({ contact, booking, tenant, invoice, payment, tag }) {
  const variables = {};

  // Contact variables
  if (contact) {
    const nameParts = contact.name?.split(" ") || [];
    variables.contact = {
      name: contact.name || "",
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      email: contact.email || "",
      phone: contact.phone || "",
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
      if (!config.templateId || !contact?.email) {
        return { success: false, error: "Missing template or contact email" };
      }

      // Fetch the email template
      const template = await prisma.emailTemplate.findUnique({
        where: { id: config.templateId },
      });

      if (!template) {
        return { success: false, error: "Email template not found" };
      }

      const variables = buildTemplateVariables(context);

      const result = await sendTemplatedEmail({
        to: contact.email,
        subject: template.subject,
        body: template.body,
        variables,
      });

      return result;
    }

    case "add_tag": {
      if (!config.tagId || !contact?.id) {
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
        return { success: true, message: "Tag already exists on contact" };
      }

      await prisma.contactTag.create({
        data: {
          contactId: contact.id,
          tagId: config.tagId,
        },
      });

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
        return { success: true, message: "Tag already exists on invoice" };
      }

      await prisma.invoiceTag.create({
        data: {
          invoiceId: invoice.id,
          tagId: config.tagId,
        },
      });

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
        return { success: true, message: "Tag already exists on booking" };
      }

      await prisma.bookingTag.create({
        data: {
          bookingId: booking.id,
          tagId: config.tagId,
        },
      });

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
      if (!config.status || !booking?.id) {
        return { success: false, error: "Missing status or booking" };
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: config.status },
      });

      return { success: true };
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
      const result = await executeAction(action, context);
      results.push({ action: action.type, ...result });

      if (!result.success) {
        console.error(`Workflow action failed: ${action.type}`, result.error);
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
 * @param {string} triggerType - The type of trigger (booking_created, lead_created, etc.)
 * @param {Object} context - Context data including contact, booking, tenant
 */
export async function triggerWorkflows(triggerType, context) {
  const { tenant } = context;

  if (!tenant?.id) {
    console.error("No tenant provided for workflow trigger");
    return { success: false, error: "No tenant provided" };
  }

  // Find all active workflows for this trigger type and tenant
  const workflows = await prisma.workflow.findMany({
    where: {
      tenantId: tenant.id,
      triggerType,
      active: true,
    },
  });

  if (workflows.length === 0) {
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
