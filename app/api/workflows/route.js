import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, createRateLimitResponse } from "@/lib/ratelimit";
import { ACTION_TYPES, TRIGGER_TYPES } from "@/lib/workflows";

// GET /api/workflows - Get all workflows for tenant
export async function GET(request) {
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

    const workflows = await prisma.workflow.findMany({
      where: { tenantId: tenant.id },
      include: {
        triggerTag: {
          select: {
            id: true,
            name: true,
            color: true,
          },
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
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/workflows - Create a new workflow
export async function POST(request) {
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

    const body = await request.json();
    const { name, description, triggerType, triggerTagId, actions, delayMinutes, active } = body;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Workflow name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!triggerType || !Object.values(TRIGGER_TYPES).includes(triggerType)) {
      return NextResponse.json(
        { error: "Invalid trigger type" },
        { status: 400 }
      );
    }

    // For tag-based triggers, require a tag ID
    if (
      (triggerType === TRIGGER_TYPES.TAG_ADDED || triggerType === TRIGGER_TYPES.TAG_REMOVED) &&
      !triggerTagId
    ) {
      return NextResponse.json(
        { error: "Tag-based triggers require a trigger tag" },
        { status: 400 }
      );
    }

    // Validate actions
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
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

    // Verify trigger tag belongs to tenant if provided
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

    const workflow = await prisma.workflow.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        description: description || null,
        triggerType,
        triggerTagId: triggerTagId || null,
        actions,
        delayMinutes: delayMinutes || 0,
        active: active !== undefined ? active : true,
      },
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

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
