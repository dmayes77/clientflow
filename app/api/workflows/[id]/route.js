import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { ACTION_TYPES, TRIGGER_TYPES } from "@/lib/workflows";

// GET /api/workflows/[id] - Get a single workflow with run history
export async function GET(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        triggerTag: true,
        runs: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();

    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const { name, description, triggerType, triggerTagId, actions, delayMinutes, active } = body;

    // Build update data
    const updateData = {};

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { error: "Workflow name must be at least 2 characters" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (triggerType !== undefined) {
      if (!Object.values(TRIGGER_TYPES).includes(triggerType)) {
        return NextResponse.json(
          { error: "Invalid trigger type" },
          { status: 400 }
        );
      }
      updateData.triggerType = triggerType;
    }

    if (triggerTagId !== undefined) {
      if (triggerTagId) {
        const tag = await prisma.tag.findFirst({
          where: {
            id: triggerTagId,
            tenantId: tenant.id,
          },
        });
        if (!tag) {
          return NextResponse.json({ error: "Trigger tag not found" }, { status: 404 });
        }
      }
      updateData.triggerTagId = triggerTagId || null;
    }

    if (actions !== undefined) {
      if (!Array.isArray(actions) || actions.length === 0) {
        return NextResponse.json(
          { error: "At least one action is required" },
          { status: 400 }
        );
      }
      for (const action of actions) {
        if (!action.type || !Object.values(ACTION_TYPES).includes(action.type)) {
          return NextResponse.json(
            { error: `Invalid action type: ${action.type}` },
            { status: 400 }
          );
        }
      }
      updateData.actions = actions;
    }

    if (delayMinutes !== undefined) {
      updateData.delayMinutes = delayMinutes;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: {
        triggerTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(request, { params }) {
  const rateLimitResult = rateLimit(request, { limit: 100, windowMs: 60000 });
  if (!rateLimitResult.success) {
    return createRateLimitResponse(rateLimitResult);
  }

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
