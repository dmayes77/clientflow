import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/custom-fields - Get active custom field definitions
// This allows tenants to build dynamic forms on their own websites
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        customFields: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            key: true,
            group: true,
            fieldType: true,
            options: true,
            required: true,
            order: true,
          },
          orderBy: [{ group: "asc" }, { order: "asc" }, { name: "asc" }],
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Group fields by their group property for easier consumption
    const fieldsByGroup = tenant.customFields.reduce((acc, field) => {
      const groupName = field.group || "Other";
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push({
        id: field.id,
        name: field.name,
        key: field.key,
        type: field.fieldType,
        options: field.options || [],
        required: field.required,
        order: field.order,
      });
      return acc;
    }, {});

    return NextResponse.json({
      fields: tenant.customFields.map((field) => ({
        id: field.id,
        name: field.name,
        key: field.key,
        type: field.fieldType,
        options: field.options || [],
        required: field.required,
        group: field.group || null,
        order: field.order,
      })),
      fieldsByGroup,
    });
  } catch (error) {
    console.error("Error fetching custom fields:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/public/[slug]/custom-fields - Submit custom field values for a contact
// This allows tenants to receive form submissions with custom field data
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { contactEmail, customFields } = body;

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Contact email is required" },
        { status: 400 }
      );
    }

    if (!customFields || !Array.isArray(customFields) || customFields.length === 0) {
      return NextResponse.json(
        { error: "Custom fields array is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Find the contact by email
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId: tenant.id,
        email: contactEmail.toLowerCase(),
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found. Please book an appointment first or contact the business directly." },
        { status: 404 }
      );
    }

    // Get active custom fields for this tenant
    const activeFields = await prisma.customField.findMany({
      where: {
        tenantId: tenant.id,
        active: true,
      },
      select: {
        id: true,
        key: true,
        required: true,
        fieldType: true,
      },
    });

    const fieldsByKey = activeFields.reduce((acc, f) => {
      acc[f.key] = f;
      return acc;
    }, {});

    const fieldsById = activeFields.reduce((acc, f) => {
      acc[f.id] = f;
      return acc;
    }, {});

    // Validate and prepare field values
    const valuesToUpsert = [];
    const errors = [];

    for (const cf of customFields) {
      // Accept either fieldId or fieldKey
      const field = cf.fieldId ? fieldsById[cf.fieldId] : fieldsByKey[cf.fieldKey];

      if (!field) {
        // Skip unknown fields silently (allows form evolution)
        continue;
      }

      const value = cf.value;

      // Check required fields
      if (field.required && (value === undefined || value === null || value === "")) {
        errors.push(`Field "${cf.fieldKey || cf.fieldId}" is required`);
        continue;
      }

      // Convert value to string for storage
      let stringValue = "";
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Multiselect: store as comma-separated
          stringValue = value.join(",");
        } else if (typeof value === "boolean") {
          stringValue = value ? "true" : "false";
        } else {
          stringValue = String(value);
        }
      }

      valuesToUpsert.push({
        contactId: contact.id,
        fieldId: field.id,
        value: stringValue,
      });
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Upsert all field values
    await prisma.$transaction(
      valuesToUpsert.map((v) =>
        prisma.contactCustomFieldValue.upsert({
          where: {
            contactId_fieldId: {
              contactId: v.contactId,
              fieldId: v.fieldId,
            },
          },
          update: { value: v.value },
          create: v,
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: "Custom field values saved successfully",
      updatedFields: valuesToUpsert.length,
    });
  } catch (error) {
    console.error("Error saving custom field values:", error);
    return NextResponse.json({ error: "Failed to save custom field values" }, { status: 500 });
  }
}
