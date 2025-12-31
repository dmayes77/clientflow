import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { checkContactLimit } from "@/lib/plan-limits";

// POST /api/contacts/import - Import contacts from CSV
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { contacts, tags, skipDuplicates = true } = body;

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json(
        { error: "Invalid import data. Expected array of contacts." },
        { status: 400 }
      );
    }

    // Check plan limits
    const limitCheck = await checkContactLimit(tenant.id);
    const availableSlots = limitCheck.limit - limitCheck.current;

    if (contacts.length > availableSlots) {
      return NextResponse.json(
        {
          error: `Import would exceed your plan limit. You can add ${availableSlots} more contacts. Current: ${limitCheck.current}, Limit: ${limitCheck.limit}`,
          code: "LIMIT_EXCEEDED",
          limit: limitCheck.limit,
          current: limitCheck.current,
          available: availableSlots,
        },
        { status: 403 }
      );
    }

    const results = {
      total: contacts.length,
      imported: 0,
      skipped: 0,
      errors: [],
      contacts: [],
    };

    // Process tags if provided
    let tagIds = [];
    if (tags && tags.length > 0) {
      // Find or create tags
      for (const tagName of tags) {
        const tag = await prisma.tag.upsert({
          where: {
            tenantId_name: {
              tenantId: tenant.id,
              name: tagName,
            },
          },
          create: {
            tenantId: tenant.id,
            name: tagName,
            color: "blue",
            type: "custom",
          },
          update: {},
        });
        tagIds.push(tag.id);
      }
    }

    // Import contacts
    for (const contactData of contacts) {
      try {
        // Validate required fields
        if (!contactData.name || !contactData.email) {
          results.errors.push({
            row: contactData,
            error: "Missing required fields (name, email)",
          });
          results.skipped++;
          continue;
        }

        // Check for existing contact by email
        const existing = await prisma.contact.findFirst({
          where: {
            tenantId: tenant.id,
            email: contactData.email.toLowerCase(),
          },
        });

        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            continue;
          } else {
            // Update existing contact (merge)
            const updated = await prisma.contact.update({
              where: { id: existing.id },
              data: {
                name: contactData.name || existing.name,
                phone: contactData.phone || existing.phone,
                company: contactData.company || existing.company,
                website: contactData.website || existing.website,
                notes: contactData.notes
                  ? existing.notes
                    ? `${existing.notes}\n\n${contactData.notes}`
                    : contactData.notes
                  : existing.notes,
              },
            });

            // Add tags to existing contact
            if (tagIds.length > 0) {
              for (const tagId of tagIds) {
                await prisma.contactTag.upsert({
                  where: {
                    contactId_tagId: {
                      contactId: updated.id,
                      tagId,
                    },
                  },
                  create: {
                    contactId: updated.id,
                    tagId,
                  },
                  update: {},
                });
              }
            }

            results.imported++;
            results.contacts.push(updated);
            continue;
          }
        }

        // Create new contact
        const newContact = await prisma.contact.create({
          data: {
            tenantId: tenant.id,
            name: contactData.name,
            email: contactData.email.toLowerCase(),
            phone: contactData.phone || null,
            company: contactData.company || null,
            website: contactData.website || null,
            status: contactData.status || "lead",
            notes: contactData.notes || null,
          },
        });

        // Add tags to new contact
        if (tagIds.length > 0) {
          for (const tagId of tagIds) {
            await prisma.contactTag.create({
              data: {
                contactId: newContact.id,
                tagId,
              },
            });
          }
        }

        results.imported++;
        results.contacts.push(newContact);

        // Trigger lead_created workflow (async, don't wait)
        triggerWorkflows("lead_created", {
          tenant,
          contact: newContact,
        }).catch((err) => {
          console.error("Error triggering workflow:", err);
        });
      } catch (error) {
        console.error("Error importing contact:", error);
        results.errors.push({
          row: contactData,
          error: error.message,
        });
        results.skipped++;
      }
    }

    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
