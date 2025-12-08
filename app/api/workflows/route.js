import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/workflows - List all workflows
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const workflows = await prisma.workflow.findMany({
      where: { tenantId: tenant.id },
      include: {
        triggerTag: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { runs: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, description, triggerType, triggerTagId, delayMinutes, actions, active } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Workflow name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!triggerType) {
      return NextResponse.json(
        { error: "Trigger type is required" },
        { status: 400 }
      );
    }

    // Validate triggerTagId if trigger type requires it
    if ((triggerType === "tag_added" || triggerType === "tag_removed") && !triggerTagId) {
      return NextResponse.json(
        { error: "A tag must be selected for this trigger type" },
        { status: 400 }
      );
    }

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

    const workflow = await prisma.workflow.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        description: description || null,
        triggerType,
        triggerTagId: triggerTagId || null,
        delayMinutes: parseInt(delayMinutes) || 0,
        actions: actions || [],
        active: active !== false,
      },
      include: {
        triggerTag: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { runs: true },
        },
      },
    });

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
