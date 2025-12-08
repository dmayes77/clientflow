import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/workflows/[id] - Get a single workflow
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        triggerTag: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { runs: true },
        },
        runs: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/workflows/[id] - Update a workflow
export async function PUT(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerTagId, delayMinutes, actions, active } = body;

    // Build update data - only include fields that were provided
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
      updateData.description = description || null;
    }

    if (triggerType !== undefined) {
      updateData.triggerType = triggerType;
    }

    if (triggerTagId !== undefined) {
      // Verify the tag belongs to this tenant if provided
      if (triggerTagId) {
        const tag = await prisma.tag.findFirst({
          where: { id: triggerTagId, tenantId: tenant.id },
        });
        if (!tag) {
          return NextResponse.json(
            { error: "Invalid tag selected" },
            { status: 400 }
          );
        }
      }
      updateData.triggerTagId = triggerTagId || null;
    }

    if (delayMinutes !== undefined) {
      updateData.delayMinutes = parseInt(delayMinutes) || 0;
    }

    if (actions !== undefined) {
      updateData.actions = actions;
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
      include: {
        triggerTag: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { runs: true },
        },
      },
    });

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/workflows/[id] - Delete a workflow
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    await prisma.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
