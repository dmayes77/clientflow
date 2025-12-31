import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedTenant } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerWorkflows } from "@/lib/workflow-executor";

const bulkAssignSchema = z.object({
  operation: z.enum(["assign", "remove"]),
  tagId: z.string().cuid("Invalid tag ID"),
  entityType: z.enum(["contact", "invoice", "booking", "payment"]),
  entityIds: z.array(z.string().cuid()).min(1, "At least one entity ID required").max(1000, "Maximum 1000 entities per request"),
});

/**
 * Bulk tag operations - assign or remove tags from multiple entities
 * POST /api/tags/bulk
 */
export async function POST(request) {
  try {
    // Authenticate
    const tenant = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = bulkAssignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { operation, tagId, entityType, entityIds } = validation.data;

    // Verify tag exists and belongs to tenant
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        tenantId: tenant.id,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Determine the model and field names based on entity type
    const modelMap = {
      contact: {
        model: prisma.contact,
        tagModel: prisma.contactTag,
        idField: "contactId",
        foreignKey: "contactId",
        addTrigger: "tag_added",
        removeTrigger: "tag_removed",
      },
      invoice: {
        model: prisma.invoice,
        tagModel: prisma.invoiceTag,
        idField: "invoiceId",
        foreignKey: "invoiceId",
        addTrigger: "invoice_tag_added",
        removeTrigger: "invoice_tag_removed",
      },
      booking: {
        model: prisma.booking,
        tagModel: prisma.bookingTag,
        idField: "bookingId",
        foreignKey: "bookingId",
        addTrigger: "booking_tag_added",
        removeTrigger: "booking_tag_removed",
      },
      payment: {
        model: prisma.payment,
        tagModel: prisma.paymentTag,
        idField: "paymentId",
        foreignKey: "paymentId",
        addTrigger: "payment_tag_added",
        removeTrigger: "payment_tag_removed",
      },
    };

    const { model, tagModel, idField, foreignKey, addTrigger, removeTrigger } = modelMap[entityType];

    // Verify all entities exist and belong to tenant
    const entities = await model.findMany({
      where: {
        id: { in: entityIds },
        tenantId: tenant.id,
      },
      select: { id: true },
    });

    if (entities.length !== entityIds.length) {
      return NextResponse.json(
        {
          error: "Some entities not found or do not belong to your account",
          found: entities.length,
          requested: entityIds.length,
        },
        { status: 400 }
      );
    }

    let result;

    if (operation === "assign") {
      // Bulk assign: create tag assignments (use createMany with skipDuplicates)
      const data = entityIds.map((entityId) => ({
        [foreignKey]: entityId,
        tagId,
      }));

      result = await tagModel.createMany({
        data,
        skipDuplicates: true, // Don't fail if tag already assigned
      });

      // Trigger workflows for bulk tag addition (async, don't block response)
      if (result.count > 0) {
        triggerBulkWorkflows({
          triggerType: addTrigger,
          entityType,
          entityIds,
          tag,
          tenant,
        }).catch((err) => {
          console.error(`Error triggering bulk ${addTrigger} workflows:`, err);
        });
      }

      return NextResponse.json({
        success: true,
        operation: "assign",
        tag: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
        },
        entityType,
        processed: entityIds.length,
        created: result.count,
        skipped: entityIds.length - result.count,
        message: `Assigned "${tag.name}" to ${result.count} ${entityType}(s) (${entityIds.length - result.count} already had this tag)`,
      });
    } else {
      // Bulk remove: delete tag assignments
      result = await tagModel.deleteMany({
        where: {
          [foreignKey]: { in: entityIds },
          tagId,
        },
      });

      // Trigger workflows for bulk tag removal (async, don't block response)
      if (result.count > 0) {
        triggerBulkWorkflows({
          triggerType: removeTrigger,
          entityType,
          entityIds,
          tag,
          tenant,
        }).catch((err) => {
          console.error(`Error triggering bulk ${removeTrigger} workflows:`, err);
        });
      }

      return NextResponse.json({
        success: true,
        operation: "remove",
        tag: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
        },
        entityType,
        processed: entityIds.length,
        removed: result.count,
        message: `Removed "${tag.name}" from ${result.count} ${entityType}(s)`,
      });
    }
  } catch (error) {
    console.error("Error in bulk tag operation:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

/**
 * Trigger workflows for bulk tag operations
 * Processes in batches to avoid overwhelming the system
 */
async function triggerBulkWorkflows({ triggerType, entityType, entityIds, tag, tenant }) {
  const BATCH_SIZE = 10;

  // Fetch full entities with related data for workflow context
  let entities;
  switch (entityType) {
    case "contact":
      entities = await prisma.contact.findMany({
        where: { id: { in: entityIds } },
      });
      break;
    case "invoice":
      entities = await prisma.invoice.findMany({
        where: { id: { in: entityIds } },
        include: { contact: true },
      });
      break;
    case "booking":
      entities = await prisma.booking.findMany({
        where: { id: { in: entityIds } },
        include: { contact: true, service: true },
      });
      break;
    case "payment":
      entities = await prisma.payment.findMany({
        where: { id: { in: entityIds } },
        include: { contact: true, invoice: true },
      });
      break;
    default:
      return;
  }

  // Process in batches
  for (let i = 0; i < entities.length; i += BATCH_SIZE) {
    const batch = entities.slice(i, i + BATCH_SIZE);

    // Trigger workflows for each entity in the batch
    await Promise.all(
      batch.map((entity) => {
        const context = { tenant, tag };

        switch (entityType) {
          case "contact":
            context.contact = entity;
            break;
          case "invoice":
            context.invoice = entity;
            context.contact = entity.contact;
            break;
          case "booking":
            context.booking = entity;
            context.contact = entity.contact;
            break;
          case "payment":
            context.payment = entity;
            context.contact = entity.contact;
            context.invoice = entity.invoice;
            break;
        }

        return triggerWorkflows(triggerType, context);
      })
    );

    // Small delay between batches to prevent overwhelming the system
    if (i + BATCH_SIZE < entities.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
