import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerWebhook } from "@/lib/webhooks";

// POST /api/public/[slug]/lead - Capture a lead (partial form data)
export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const body = await request.json();

    const {
      name,
      email,
      phone,
      serviceId,
      packageId,
      notes,
      source = "booking_form",
    } = body;

    // Email is the minimum required field
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    // Validate service/package if provided
    if (serviceId) {
      const service = await prisma.service.findFirst({
        where: {
          id: serviceId,
          tenantId: tenant.id,
          active: true,
        },
      });
      if (!service) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
    }

    if (packageId) {
      const pkg = await prisma.package.findFirst({
        where: {
          id: packageId,
          tenantId: tenant.id,
          active: true,
        },
      });
      if (!pkg) {
        return NextResponse.json({ error: "Package not found" }, { status: 404 });
      }
    }

    // Find existing lead/client by email
    const existingClient = await prisma.client.findFirst({
      where: {
        tenantId: tenant.id,
        email: email.toLowerCase(),
      },
    });

    let lead;
    let isNew = false;

    if (existingClient) {
      // Update existing record with new info (only if they're still a lead)
      // Don't downgrade clients back to leads
      const updateData = {};

      if (name && !existingClient.name) {
        updateData.name = name;
      }
      if (phone && !existingClient.phone) {
        updateData.phone = phone;
      }
      if (notes) {
        // Append notes
        updateData.notes = existingClient.notes
          ? `${existingClient.notes}\n---\n${notes}`
          : notes;
      }
      // Update interested service/package if provided and they're a lead
      if (existingClient.type === "lead") {
        if (serviceId) {
          updateData.interestedInServiceId = serviceId;
          updateData.interestedInPackageId = null;
        } else if (packageId) {
          updateData.interestedInPackageId = packageId;
          updateData.interestedInServiceId = null;
        }
      }

      if (Object.keys(updateData).length > 0) {
        lead = await prisma.client.update({
          where: { id: existingClient.id },
          data: updateData,
        });
      } else {
        lead = existingClient;
      }
    } else {
      // Create new lead
      lead = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: name || "Unknown",
          email: email.toLowerCase(),
          phone: phone || null,
          notes: notes || null,
          type: "lead",
          leadStatus: "new",
          source,
          interestedInServiceId: serviceId || null,
          interestedInPackageId: packageId || null,
        },
      });
      isNew = true;
    }

    // Trigger webhook for new leads
    if (isNew) {
      triggerWebhook(tenant.id, "lead.created", {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        interestedInServiceId: lead.interestedInServiceId,
        interestedInPackageId: lead.interestedInPackageId,
        createdAt: lead.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      isNew,
      message: isNew ? "Lead captured successfully" : "Lead information updated",
    });
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Failed to capture lead" },
      { status: 500 }
    );
  }
}
