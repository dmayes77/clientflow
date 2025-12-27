import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const createCustomFieldSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  group: z.string().max(100).optional().nullable(),
  fieldType: z.enum(["text", "number", "date", "select", "multiselect", "boolean", "textarea"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional().default(false),
  order: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

// GET /api/custom-fields - List all custom fields
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = {
      tenantId: tenant.id,
      ...(activeOnly ? { active: true } : {}),
    };

    const customFields = await prisma.customField.findMany({
      where,
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/custom-fields - Create custom field
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const validation = createCustomFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check for key uniqueness
    const existing = await prisma.customField.findUnique({
      where: {
        tenantId_key: {
          tenantId: tenant.id,
          key: data.key,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A custom field with this key already exists" },
        { status: 400 }
      );
    }

    const customField = await prisma.customField.create({
      data: {
        tenantId: tenant.id,
        name: data.name,
        key: data.key,
        group: data.group || null,
        fieldType: data.fieldType,
        options: data.options || null,
        required: data.required,
        order: data.order,
        active: data.active,
      },
    });

    return NextResponse.json(customField, { status: 201 });
  } catch (error) {
    console.error("Error creating custom field:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
