import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/email-templates - List all email templates
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/email-templates - Create a new email template
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { name, subject, body: templateBody, description, category } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Template name must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!subject || subject.trim().length < 1) {
      return NextResponse.json(
        { error: "Email subject is required" },
        { status: 400 }
      );
    }

    if (!templateBody || templateBody.trim().length < 1) {
      return NextResponse.json(
        { error: "Email body is required" },
        { status: 400 }
      );
    }

    // Check for duplicate template name
    const existingTemplate = await prisma.emailTemplate.findUnique({
      where: {
        tenantId_name: {
          tenantId: tenant.id,
          name: name.trim(),
        },
      },
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: "A template with this name already exists" },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.create({
      data: {
        tenantId: tenant.id,
        name: name.trim(),
        subject: subject.trim(),
        body: templateBody,
        description: description || null,
        category: category || null,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
