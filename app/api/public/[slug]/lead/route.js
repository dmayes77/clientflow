import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchContactCreated, dispatchLeadCreated } from "@/lib/webhooks";
import { triggerWorkflows } from "@/lib/workflow-executor";

/**
 * POST /api/public/[slug]/lead
 * Auto-save a lead when they enter their contact info on the booking welcome screen.
 * This creates a contact with "Lead" and "Auto-Saved Lead" tags without requiring
 * a booking or payment. The lead will convert to a client only when they complete
 * a payment (deposit or full).
 */
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

    const { name, email, phone } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        businessName: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Find or create the contact
    let contact = await prisma.contact.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase(),
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    let isNewContact = false;
    let wasAlreadyLead = false;

    if (!contact) {
      // Create new contact
      contact = await prisma.contact.create({
        data: {
          tenantId: tenant.id,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
        },
        include: {
          tags: {
            include: { tag: true },
          },
        },
      });
      isNewContact = true;
    } else {
      // Update existing contact info if provided
      const updates = {};
      if (name && name !== contact.name) updates.name = name;
      if (phone && phone !== contact.phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        contact = await prisma.contact.update({
          where: { id: contact.id },
          data: updates,
          include: {
            tags: {
              include: { tag: true },
            },
          },
        });
      }

      // Check if they already have Lead or Client tag
      const hasLeadTag = contact.tags.some((ct) => ct.tag.name === "Lead" && ct.tag.isSystem);
      const hasClientTag = contact.tags.some((ct) => ct.tag.name === "Client" && ct.tag.isSystem);
      wasAlreadyLead = hasLeadTag || hasClientTag;
    }

    // Apply Lead and Auto-Saved Lead tags if this is a new contact or they're not already a lead/client
    if (isNewContact || !wasAlreadyLead) {
      // Find the Lead system tag
      const leadTag = await prisma.tag.findFirst({
        where: {
          tenantId: tenant.id,
          name: "Lead",
          type: "contact",
          isSystem: true,
        },
      });

      if (leadTag) {
        // Add Lead tag if not already present
        const hasLeadTag = contact.tags.some((ct) => ct.tagId === leadTag.id);
        if (!hasLeadTag) {
          await prisma.contactTag.upsert({
            where: {
              contactId_tagId: {
                contactId: contact.id,
                tagId: leadTag.id,
              },
            },
            update: {},
            create: {
              contactId: contact.id,
              tagId: leadTag.id,
            },
          });

          // Trigger lead_created workflow for new leads
          if (isNewContact) {
            try {
              triggerWorkflows("lead_created", {
                tenant,
                contact,
              }).catch((err) => {
                console.error("Error triggering lead_created workflow:", err);
              });
            } catch (err) {
              console.error("Error triggering lead_created workflow:", err);
            }
          }
        }
      }

      // Find or create the Auto-Saved Lead tag (non-system, can be deleted by user)
      let autoSavedTag = await prisma.tag.findFirst({
        where: {
          tenantId: tenant.id,
          name: "Auto-Saved Lead",
          type: "contact",
        },
      });

      if (!autoSavedTag) {
        autoSavedTag = await prisma.tag.create({
          data: {
            tenantId: tenant.id,
            name: "Auto-Saved Lead",
            color: "blue",
            description: "Lead auto-saved from booking page before completing checkout",
            type: "contact",
            isSystem: false,
          },
        });
      }

      // Add Auto-Saved Lead tag
      const hasAutoSavedTag = contact.tags.some((ct) => ct.tagId === autoSavedTag.id);
      if (!hasAutoSavedTag) {
        await prisma.contactTag.upsert({
          where: {
            contactId_tagId: {
              contactId: contact.id,
              tagId: autoSavedTag.id,
            },
          },
          update: {},
          create: {
            contactId: contact.id,
            tagId: autoSavedTag.id,
          },
        });
      }
    }

    // Dispatch webhook events (fire and forget)
    if (isNewContact) {
      dispatchContactCreated(tenant.id, contact).catch((err) =>
        console.error("Failed to dispatch contact.created webhook:", err)
      );
      dispatchLeadCreated(tenant.id, contact).catch((err) =>
        console.error("Failed to dispatch lead.created webhook:", err)
      );
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
      },
      isNewContact,
      message: isNewContact
        ? "Lead saved successfully"
        : "Contact info updated",
    });
  } catch (error) {
    console.error("Error saving lead:", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
