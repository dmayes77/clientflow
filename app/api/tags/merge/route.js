import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedTenant } from "@/lib/auth";

const prisma = new PrismaClient();

const mergeTagsSchema = z.object({
  sourceTagId: z.string().cuid("Invalid source tag ID"),
  targetTagId: z.string().cuid("Invalid target tag ID"),
});

/**
 * Merge two tags - moves all assignments from source to target and deletes source
 * POST /api/tags/merge
 */
export async function POST(request) {
  try {
    // Authenticate
    const tenant = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate request body
    const body = await request.json();
    const validation = mergeTagsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { sourceTagId, targetTagId } = validation.data;

    // Prevent merging tag with itself
    if (sourceTagId === targetTagId) {
      return NextResponse.json(
        { error: "Cannot merge a tag with itself" },
        { status: 400 }
      );
    }

    // Fetch both tags and verify ownership
    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findFirst({
        where: {
          id: sourceTagId,
          tenantId: tenant.id,
        },
        include: {
          _count: {
            select: {
              contacts: true,
              invoices: true,
              bookings: true,
              payments: true,
            },
          },
        },
      }),
      prisma.tag.findFirst({
        where: {
          id: targetTagId,
          tenantId: tenant.id,
        },
      }),
    ]);

    if (!sourceTag) {
      return NextResponse.json(
        { error: "Source tag not found" },
        { status: 404 }
      );
    }

    if (!targetTag) {
      return NextResponse.json(
        { error: "Target tag not found" },
        { status: 404 }
      );
    }

    // Prevent merging system tags
    if (sourceTag.isSystem) {
      return NextResponse.json(
        { error: "Cannot merge system tags" },
        { status: 400 }
      );
    }

    if (targetTag.isSystem) {
      return NextResponse.json(
        { error: "Cannot merge into system tags" },
        { status: 400 }
      );
    }

    // Perform merge in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get all entities that have the source tag
      const [contactTags, invoiceTags, bookingTags, paymentTags] = await Promise.all([
        tx.contactTag.findMany({
          where: { tagId: sourceTagId },
          select: { contactId: true },
        }),
        tx.invoiceTag.findMany({
          where: { tagId: sourceTagId },
          select: { invoiceId: true },
        }),
        tx.bookingTag.findMany({
          where: { tagId: sourceTagId },
          select: { bookingId: true },
        }),
        tx.paymentTag.findMany({
          where: { tagId: sourceTagId },
          select: { paymentId: true },
        }),
      ]);

      // For each entity type, add target tag if it doesn't already exist
      // Contact tags
      for (const { contactId } of contactTags) {
        await tx.contactTag.upsert({
          where: {
            contactId_tagId: {
              contactId,
              tagId: targetTagId,
            },
          },
          create: {
            contactId,
            tagId: targetTagId,
          },
          update: {}, // Already exists, do nothing
        });
      }

      // Invoice tags
      for (const { invoiceId } of invoiceTags) {
        await tx.invoiceTag.upsert({
          where: {
            invoiceId_tagId: {
              invoiceId,
              tagId: targetTagId,
            },
          },
          create: {
            invoiceId,
            tagId: targetTagId,
          },
          update: {},
        });
      }

      // Booking tags
      for (const { bookingId } of bookingTags) {
        await tx.bookingTag.upsert({
          where: {
            bookingId_tagId: {
              bookingId,
              tagId: targetTagId,
            },
          },
          create: {
            bookingId,
            tagId: targetTagId,
          },
          update: {},
        });
      }

      // Payment tags
      for (const { paymentId } of paymentTags) {
        await tx.paymentTag.upsert({
          where: {
            paymentId_tagId: {
              paymentId,
              tagId: targetTagId,
            },
          },
          create: {
            paymentId,
            tagId: targetTagId,
          },
          update: {},
        });
      }

      // Delete all source tag assignments (cascade will handle this)
      // Then delete the source tag
      await tx.tag.delete({
        where: { id: sourceTagId },
      });

      // Return updated target tag with new counts
      return tx.tag.findUnique({
        where: { id: targetTagId },
        include: {
          _count: {
            select: {
              contacts: true,
              invoices: true,
              bookings: true,
              payments: true,
            },
          },
        },
      });
    });

    const totalMerged =
      sourceTag._count.contacts +
      sourceTag._count.invoices +
      sourceTag._count.bookings +
      sourceTag._count.payments;

    return NextResponse.json({
      success: true,
      message: `Successfully merged ${totalMerged} items from "${sourceTag.name}" into "${targetTag.name}"`,
      tag: result,
      merged: {
        sourceTag: {
          id: sourceTag.id,
          name: sourceTag.name,
        },
        contacts: sourceTag._count.contacts,
        invoices: sourceTag._count.invoices,
        bookings: sourceTag._count.bookings,
        payments: sourceTag._count.payments,
        total: totalMerged,
      },
    });
  } catch (error) {
    console.error("Error merging tags:", error);
    return NextResponse.json(
      { error: "Failed to merge tags" },
      { status: 500 }
    );
  }
}
