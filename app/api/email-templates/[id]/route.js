import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/email-templates/[id] - Get a single email template
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching email template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/email-templates/[id] - Update an email template
export async function PUT(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, subject, body: templateBody, description, category } = body;

    // Build update data - only include fields that were provided
    const updateData = {};

    // System templates can be edited but systemKey and isSystem cannot be changed
    // (name, subject, body, description, category can all be customized by tenant)

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return NextResponse.json(
          { error: "Template name must be at least 2 characters" },
          { status: 400 }
        );
      }

      // Check for duplicate name (excluding current template)
      const duplicateTemplate = await prisma.emailTemplate.findFirst({
        where: {
          tenantId: tenant.id,
          name: name.trim(),
          NOT: { id },
        },
      });

      if (duplicateTemplate) {
        return NextResponse.json(
          { error: "A template with this name already exists" },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
    }

    if (subject !== undefined) {
      if (subject.trim().length < 1) {
        return NextResponse.json(
          { error: "Email subject is required" },
          { status: 400 }
        );
      }
      updateData.subject = subject.trim();
    }

    if (templateBody !== undefined) {
      if (templateBody.trim().length < 1) {
        return NextResponse.json(
          { error: "Email body is required" },
          { status: 400 }
        );
      }
      updateData.body = templateBody;
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    if (category !== undefined) {
      updateData.category = category || null;
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/email-templates/[id] - Delete an email template
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingTemplate = await prisma.emailTemplate.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Prevent deletion of system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json(
        {
          error: "System templates cannot be deleted. You can edit them to customize for your business.",
        },
        { status: 403 }
      );
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
