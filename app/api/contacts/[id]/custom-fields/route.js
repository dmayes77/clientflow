import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/contacts/[id]/custom-fields - Get custom field values for a contact
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact || contact.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Get all custom fields with their values for this contact
    const customFields = await prisma.customField.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
      },
      include: {
        values: {
          where: {
            contactId: id,
          },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    // Transform to include value directly
    const fieldsWithValues = customFields.map((field) => ({
      id: field.id,
      name: field.name,
      key: field.key,
      fieldType: field.fieldType,
      options: field.options,
      required: field.required,
      value: field.values[0]?.value || null,
    }));

    return NextResponse.json(fieldsWithValues);
  } catch (error) {
    console.error("Error fetching contact custom fields:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts/[id]/custom-fields - Set custom field values for a contact
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Verify contact belongs to tenant
    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact || contact.tenantId !== tenant.id) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const { values } = body; // Expected: [{ fieldId, value }]

    if (!values || !Array.isArray(values)) {
      return NextResponse.json(
        { error: "Invalid request. Expected { values: [{ fieldId, value }] }" },
        { status: 400 }
      );
    }

    // Upsert all values
    const results = await Promise.all(
      values.map(async ({ fieldId, value }) => {
        // Verify field belongs to tenant
        const field = await prisma.customField.findUnique({
          where: { id: fieldId },
        });

        if (!field || field.tenantId !== tenant.id) {
          throw new Error(`Custom field ${fieldId} not found`);
        }

        return prisma.contactCustomFieldValue.upsert({
          where: {
            contactId_fieldId: {
              contactId: id,
              fieldId,
            },
          },
          create: {
            contactId: id,
            fieldId,
            value: String(value),
          },
          update: {
            value: String(value),
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error setting contact custom fields:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
