import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        businessPhone: true,
        contactPerson: true,
        businessWebsite: true,
        businessDescription: true,
        logoUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        metadata: true,
        setupComplete: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching business info:", error);
    return NextResponse.json(
      { error: "Failed to fetch business information" },
      { status: 500 }
    );
  }
}

function generateSlug(businessName) {
  if (!businessName) return null;

  // Convert to lowercase, remove special characters, replace spaces with hyphens
  let slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen

  return slug;
}

export async function PUT(request) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const data = await request.json();

    // Validate and sanitize input
    const updateData = {};

    // Business Information
    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.businessAddress !== undefined) updateData.businessAddress = data.businessAddress;
    if (data.businessCity !== undefined) updateData.businessCity = data.businessCity;
    if (data.businessState !== undefined) updateData.businessState = data.businessState;
    if (data.businessZip !== undefined) updateData.businessZip = data.businessZip;
    if (data.businessCountry !== undefined) updateData.businessCountry = data.businessCountry;
    if (data.businessPhone !== undefined) updateData.businessPhone = data.businessPhone;
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson;
    if (data.businessWebsite !== undefined) updateData.businessWebsite = data.businessWebsite;
    if (data.businessDescription !== undefined) updateData.businessDescription = data.businessDescription;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;

    // Social Media
    if (data.facebookUrl !== undefined) updateData.facebookUrl = data.facebookUrl;
    if (data.twitterUrl !== undefined) updateData.twitterUrl = data.twitterUrl;
    if (data.instagramUrl !== undefined) updateData.instagramUrl = data.instagramUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl;

    // Metadata
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    // Setup complete flag
    if (data.setupComplete !== undefined) updateData.setupComplete = data.setupComplete;

    // Generate slug if business name is provided and slug doesn't exist
    if (data.businessName && !tenant.slug) {
      let baseSlug = generateSlug(data.businessName);
      let slug = baseSlug;
      let counter = 1;

      // Ensure slug is unique
      while (true) {
        const existingTenant = await prisma.tenant.findUnique({
          where: { slug },
        });

        if (!existingTenant) {
          updateData.slug = slug;
          break;
        }

        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
      select: {
        id: true,
        slug: true,
        businessName: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        businessPhone: true,
        contactPerson: true,
        businessWebsite: true,
        businessDescription: true,
        logoUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        metadata: true,
        setupComplete: true,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: updatedTenant,
    });
  } catch (error) {
    console.error("Error updating business info:", error);
    return NextResponse.json(
      { error: "Failed to update business information" },
      { status: 500 }
    );
  }
}
