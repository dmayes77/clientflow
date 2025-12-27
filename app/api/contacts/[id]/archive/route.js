import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// PATCH /api/contacts/[id]/archive - Archive a contact
export async function PATCH(request, { params }) {
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

    // Archive the contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error archiving contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]/archive - Unarchive a contact
export async function DELETE(request, { params }) {
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

    // Unarchive the contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: {
        archived: false,
        archivedAt: null,
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("Error unarchiving contact:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
