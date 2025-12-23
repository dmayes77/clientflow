import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getScheduleTypes, getEventTypes, getFilterOptions, seedDefaultAlertRules } from "@/lib/alert-runner";

// GET /api/admin/alert-rules - List all alert rules
export async function GET(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Return dropdown options
    if (action === "options") {
      // Fetch plans for filter dropdown
      const plans = await prisma.plan.findMany({
        where: { active: true },
        select: { id: true, name: true },
        orderBy: { sortOrder: "asc" },
      });

      return NextResponse.json({
        scheduleTypes: getScheduleTypes(),
        eventTypes: getEventTypes(),
        filterOptions: getFilterOptions(),
        plans: plans.map((p) => ({ value: p.id, label: p.name })),
      });
    }

    // Seed default rules
    if (action === "seed") {
      const results = await seedDefaultAlertRules();
      return NextResponse.json({ results });
    }

    const rules = await prisma.alertRule.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Get recent log counts for each rule
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const logCounts = await prisma.alertRuleLog.groupBy({
      by: ["ruleId", "status"],
      where: {
        createdAt: { gte: oneDayAgo },
      },
      _count: true,
    });

    // Merge log counts into rules
    const rulesWithStats = rules.map((rule) => {
      const ruleLogs = logCounts.filter((l) => l.ruleId === rule.id);
      return {
        ...rule,
        recentStats: {
          sent: ruleLogs.find((l) => l.status === "sent")?._count || 0,
          skipped: ruleLogs.find((l) => l.status === "skipped")?._count || 0,
          failed: ruleLogs.find((l) => l.status === "failed")?._count || 0,
        },
      };
    });

    return NextResponse.json({ rules: rulesWithStats });
  } catch (error) {
    console.error("Error fetching alert rules:", error);
    return NextResponse.json({ error: "Failed to fetch alert rules" }, { status: 500 });
  }
}

// POST /api/admin/alert-rules - Create a new alert rule
export async function POST(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      triggerType,
      scheduleType,
      eventType,
      filters,
      alertType = "warning",
      alertTitle,
      alertMessage,
      actionUrl,
      actionLabel,
      active = true,
      sendEmail = false,
      emailSubject,
      emailTemplate,
      cooldownHours = 24,
    } = body;

    // Validate required fields
    if (!name || !triggerType || !alertTitle || !alertMessage) {
      return NextResponse.json(
        { error: "Name, trigger type, title, and message are required" },
        { status: 400 }
      );
    }

    // Validate trigger configuration
    if (triggerType === "schedule" && !scheduleType) {
      return NextResponse.json(
        { error: "Schedule type is required for scheduled alerts" },
        { status: 400 }
      );
    }

    if (triggerType === "event" && !eventType) {
      return NextResponse.json(
        { error: "Event type is required for event-based alerts" },
        { status: 400 }
      );
    }

    const rule = await prisma.alertRule.create({
      data: {
        name,
        description,
        triggerType,
        scheduleType: triggerType === "schedule" ? scheduleType : null,
        eventType: triggerType === "event" ? eventType : null,
        filters,
        alertType,
        alertTitle,
        alertMessage,
        actionUrl,
        actionLabel,
        active,
        sendEmail,
        emailSubject,
        emailTemplate,
        cooldownHours,
        createdBy: "admin",
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error("Error creating alert rule:", error);
    return NextResponse.json({ error: "Failed to create alert rule" }, { status: 500 });
  }
}

// PATCH /api/admin/alert-rules - Update an alert rule
export async function PATCH(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    // If changing trigger type, ensure appropriate fields
    if (updates.triggerType === "schedule") {
      updates.eventType = null;
    } else if (updates.triggerType === "event") {
      updates.scheduleType = null;
    }

    const rule = await prisma.alertRule.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("Error updating alert rule:", error);
    return NextResponse.json({ error: "Failed to update alert rule" }, { status: 500 });
  }
}

// DELETE /api/admin/alert-rules?id=xxx - Delete an alert rule
export async function DELETE(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    // Delete logs first
    await prisma.alertRuleLog.deleteMany({
      where: { ruleId: id },
    });

    // Delete the rule
    await prisma.alertRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert rule:", error);
    return NextResponse.json({ error: "Failed to delete alert rule" }, { status: 500 });
  }
}
