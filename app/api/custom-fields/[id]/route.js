import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { z } from "zod";

const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  group: z.string().max(100).optional().nullable(),
  fieldType: z.enum(["text", "number", "date", "select", "multiselect", "boolean", "textarea"]).optional(),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  order: z.number().int().optional(),
  active: z.boolean().optional(),
});

// GET /api/custom-fields/[id] - Get single custom field
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const customField = await prisma.customField.findUnique({
      where: { id },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!customField || customField.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 });
    }

    return NextResponse.json(customField);
  } catch (error) {
    console.error("Error fetching custom field:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/custom-fields/[id] - Update custom field
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField || customField.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateCustomFieldSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    const updatedCustomField = await prisma.customField.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedCustomField);
  } catch (error) {
    console.error("Error updating custom field:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/custom-fields/[id] - Delete custom field
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const customField = await prisma.customField.findUnique({
      where: { id },
      include: {
        _count: {
          select: { values: true },
        },
      },
    });

    if (!customField || customField.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 });
    }

    // Check if field has values
    if (customField._count.values > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete custom field with ${customField._count.values} values. Consider deactivating it instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.customField.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
