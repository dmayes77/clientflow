import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

/**
 * Workflow Action Types
 */
export const ACTION_TYPES = {
  SEND_EMAIL: "send_email",
  ADD_TAG: "add_tag",
  REMOVE_TAG: "remove_tag",
  UPDATE_STATUS: "update_status",
  SEND_NOTIFICATION: "send_notification",
  WAIT: "wait",
};

/**
 * Workflow Trigger Types
 */
export const TRIGGER_TYPES = {
  TAG_ADDED: "tag_added",
  TAG_REMOVED: "tag_removed",
  LEAD_CREATED: "lead_created",
  BOOKING_CREATED: "booking_created",
  CLIENT_CONVERTED: "client_converted",
};

/**
 * Execute a workflow for a client
 * @param {string} workflowId - The workflow ID to execute
 * @param {string} clientId - The client ID to execute for
 * @param {object} context - Additional context (e.g., triggering tag, booking)
 */
export async function executeWorkflow(workflowId, clientId, context = {}) {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        tenant: true,
        triggerTag: true,
      },
    });

    if (!workflow || !workflow.active) {
      return { success: false, error: "Workflow not found or inactive" };
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        tags: { include: { tag: true } },
      },
    });

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Create workflow run record
    const workflowRun = await prisma.workflowRun.create({
      data: {
        workflowId,
        clientId,
        status: "running",
        startedAt: new Date(),
        executedActions: [],
      },
    });

    const actions = workflow.actions;
    const executedActions = [];

    try {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        const result = await executeAction(action, client, workflow.tenant, context);

        executedActions.push({
          actionIndex: i,
          type: action.type,
          status: result.success ? "completed" : "failed",
          result: result.message,
          executedAt: new Date().toISOString(),
        });

        if (!result.success) {
          throw new Error(result.error || "Action failed");
        }

        // If action is "wait", we'd typically queue this for later
        // For now, we'll handle immediate execution only
      }

      // Mark workflow run as completed
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: "completed",
          completedAt: new Date(),
          executedActions,
        },
      });

      return { success: true, runId: workflowRun.id };
    } catch (error) {
      // Mark workflow run as failed
      await prisma.workflowRun.update({
        where: { id: workflowRun.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: error.message,
          executedActions,
        },
      });

      return { success: false, error: error.message, runId: workflowRun.id };
    }
  } catch (error) {
    console.error("Error executing workflow:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute a single action
 */
async function executeAction(action, client, tenant, context) {
  switch (action.type) {
    case ACTION_TYPES.SEND_EMAIL:
      return await executeSendEmail(action.config, client, tenant);

    case ACTION_TYPES.ADD_TAG:
      return await executeAddTag(action.config, client, tenant);

    case ACTION_TYPES.REMOVE_TAG:
      return await executeRemoveTag(action.config, client);

    case ACTION_TYPES.UPDATE_STATUS:
      return await executeUpdateStatus(action.config, client);

    case ACTION_TYPES.SEND_NOTIFICATION:
      return await executeSendNotification(action.config, client, tenant);

    case ACTION_TYPES.WAIT:
      // For now, just log the wait - in production, you'd use a job queue
      return { success: true, message: `Wait ${action.config.minutes} minutes (skipped in immediate execution)` };

    default:
      return { success: false, error: `Unknown action type: ${action.type}` };
  }
}

/**
 * Build the "from" address for workflow emails
 * Uses the tenant's business name in the display name, but sends from ClientFlow domain
 * This allows emails to appear to come from the tenant's business
 */
function buildWorkflowFrom(tenant) {
  const businessName = tenant.businessName || tenant.name || "Your Business";
  const sanitizedName = businessName.replace(/[<>"]/g, "");
  return `${sanitizedName} <workflows@getclientflow.app>`;
}

/**
 * Send email action
 */
async function executeSendEmail(config, client, tenant) {
  try {
    const { template, subject, body } = config;

    // Replace placeholders in subject and body
    const replacedSubject = replacePlaceholders(subject, client, tenant);
    let replacedBody = replacePlaceholders(body, client, tenant);

    // Convert newlines to <br> tags for HTML email
    // Handle both literal \n and actual newlines
    replacedBody = replacedBody
      .replace(/\\n/g, '<br>')  // Handle literal \n
      .replace(/\n/g, '<br>');   // Handle actual newlines

    // Build a nice HTML email with the body content
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="line-height: 1.6;">${replacedBody}</div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          Sent by ${tenant.businessName || tenant.name || "Your Business"}
          ${tenant.businessPhone ? ` • ${tenant.businessPhone}` : ""}
        </p>
      </div>
    `;

    await sendEmail({
      to: client.email,
      subject: replacedSubject,
      html: htmlContent,
      from: buildWorkflowFrom(tenant),
      replyTo: tenant.email, // Replies go directly to the tenant
    });

    return { success: true, message: `Email sent to ${client.email}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Add tag action
 */
async function executeAddTag(config, client, tenant) {
  try {
    const { tagId } = config;

    // Check if tag exists and belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        tenantId: tenant.id,
      },
    });

    if (!tag) {
      return { success: false, error: "Tag not found" };
    }

    // Check if client already has this tag
    const existingTag = await prisma.clientTag.findUnique({
      where: {
        clientId_tagId: {
          clientId: client.id,
          tagId,
        },
      },
    });

    if (existingTag) {
      return { success: true, message: "Tag already exists on client" };
    }

    // Add the tag
    await prisma.clientTag.create({
      data: {
        clientId: client.id,
        tagId,
        addedBy: "system",
      },
    });

    // Trigger any workflows for this new tag (but prevent infinite loops)
    // Note: We don't trigger workflows here to prevent recursion
    // The calling code should handle cascading workflows carefully

    return { success: true, message: `Tag "${tag.name}" added` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove tag action
 */
async function executeRemoveTag(config, client) {
  try {
    const { tagId } = config;

    await prisma.clientTag.deleteMany({
      where: {
        clientId: client.id,
        tagId,
      },
    });

    return { success: true, message: "Tag removed" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update client status action
 */
async function executeUpdateStatus(config, client) {
  try {
    const { status, type } = config;

    const updateData = {};
    if (status) updateData.leadStatus = status;
    if (type) updateData.type = type;

    if (type === "client" && client.type === "lead") {
      updateData.convertedAt = new Date();
    }

    await prisma.client.update({
      where: { id: client.id },
      data: updateData,
    });

    return { success: true, message: `Status updated to ${status || type}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send notification to tenant (internal notification, not to clients)
 */
async function executeSendNotification(config, client, tenant) {
  try {
    const { message } = config;
    const replacedMessage = replacePlaceholders(message, client, tenant);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";

    // Send email notification to tenant
    await sendEmail({
      to: tenant.email,
      subject: `Workflow Notification: ${client.name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Workflow Notification</h2>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; line-height: 1.6;">${replacedMessage}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666;"><strong>Client:</strong> ${client.name} (${client.email})</p>
          <a href="${baseUrl}/dashboard/contacts/${client.type === "lead" ? "leads" : "clients"}/${client.id}" style="display: inline-block; background: #228be6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Contact</a>
        </div>
      `,
      from: "ClientFlow <notifications@getclientflow.app>",
    });

    return { success: true, message: "Notification sent" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Replace placeholders in text
 */
function replacePlaceholders(text, client, tenant) {
  if (!text) return text;

  return text
    .replace(/{{client\.name}}/g, client.name || "")
    .replace(/{{client\.email}}/g, client.email || "")
    .replace(/{{client\.phone}}/g, client.phone || "")
    .replace(/{{business\.name}}/g, tenant.businessName || tenant.name || "")
    .replace(/{{business\.email}}/g, tenant.email || "")
    .replace(/{{business\.phone}}/g, tenant.businessPhone || "");
}

/**
 * Trigger workflows based on an event
 * @param {string} tenantId - The tenant ID
 * @param {string} triggerType - The trigger type (from TRIGGER_TYPES)
 * @param {string} clientId - The client ID
 * @param {object} context - Additional context (e.g., tagId for tag triggers)
 */
export async function triggerWorkflows(tenantId, triggerType, clientId, context = {}) {
  try {
    const whereClause = {
      tenantId,
      active: true,
      triggerType,
    };

    // For tag-based triggers, also match the specific tag
    if (triggerType === TRIGGER_TYPES.TAG_ADDED || triggerType === TRIGGER_TYPES.TAG_REMOVED) {
      if (context.tagId) {
        whereClause.triggerTagId = context.tagId;
      }
    }

    const workflows = await prisma.workflow.findMany({
      where: whereClause,
    });

    const results = [];

    for (const workflow of workflows) {
      // Check delay - for now, execute immediately if delay is 0
      if (workflow.delayMinutes === 0) {
        const result = await executeWorkflow(workflow.id, clientId, context);
        results.push({ workflowId: workflow.id, ...result });
      } else {
        // In production, you'd queue this for later execution
        // For now, we'll still execute immediately but log the delay
        console.log(`Workflow ${workflow.id} has ${workflow.delayMinutes} minute delay (executing immediately in dev)`);
        const result = await executeWorkflow(workflow.id, clientId, context);
        results.push({ workflowId: workflow.id, ...result });
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error("Error triggering workflows:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Add a tag to a client and trigger any associated workflows
 */
export async function addTagToClient(clientId, tagId, addedBy = "user") {
  try {
    // Get the client and tag
    const [client, tag] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.tag.findUnique({ where: { id: tagId } }),
    ]);

    if (!client || !tag) {
      return { success: false, error: "Client or tag not found" };
    }

    // Check if tag is already on client
    const existingTag = await prisma.clientTag.findUnique({
      where: {
        clientId_tagId: { clientId, tagId },
      },
    });

    if (existingTag) {
      return { success: true, message: "Tag already exists", alreadyExists: true };
    }

    // Add the tag
    await prisma.clientTag.create({
      data: {
        clientId,
        tagId,
        addedBy,
      },
    });

    // Trigger workflows for tag_added
    const workflowResults = await triggerWorkflows(
      client.tenantId,
      TRIGGER_TYPES.TAG_ADDED,
      clientId,
      { tagId }
    );

    return {
      success: true,
      message: `Tag "${tag.name}" added`,
      workflowResults,
    };
  } catch (error) {
    console.error("Error adding tag to client:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a tag from a client and trigger any associated workflows
 */
export async function removeTagFromClient(clientId, tagId) {
  try {
    const [client, tag] = await Promise.all([
      prisma.client.findUnique({ where: { id: clientId } }),
      prisma.tag.findUnique({ where: { id: tagId } }),
    ]);

    if (!client) {
      return { success: false, error: "Client not found" };
    }

    // Remove the tag
    await prisma.clientTag.deleteMany({
      where: { clientId, tagId },
    });

    // Trigger workflows for tag_removed
    if (tag) {
      await triggerWorkflows(
        client.tenantId,
        TRIGGER_TYPES.TAG_REMOVED,
        clientId,
        { tagId }
      );
    }

    return { success: true, message: "Tag removed" };
  } catch (error) {
    console.error("Error removing tag from client:", error);
    return { success: false, error: error.message };
  }
}
