import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/tenant/business - Get business details
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: {
        businessName: true,
        businessDescription: true,
        businessWebsite: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        contactPerson: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching business details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Shared update logic for PUT and PATCH
async function updateBusinessDetails(request) {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const body = await request.json();

  // Extract only business-related fields
  const {
    businessName,
    businessDescription,
    businessWebsite,
    businessPhone,
    businessAddress,
    businessCity,
    businessState,
    businessZip,
    businessCountry,
    contactPerson,
    facebookUrl,
    twitterUrl,
    instagramUrl,
    linkedinUrl,
    youtubeUrl,
  } = body;

  const updateData = {};

  // Only include non-undefined values
  if (businessName !== undefined) updateData.businessName = businessName;
  if (businessDescription !== undefined) updateData.businessDescription = businessDescription;
  if (businessWebsite !== undefined) updateData.businessWebsite = businessWebsite;
  if (businessPhone !== undefined) updateData.businessPhone = businessPhone;
  if (businessAddress !== undefined) updateData.businessAddress = businessAddress;
  if (businessCity !== undefined) updateData.businessCity = businessCity;
  if (businessState !== undefined) updateData.businessState = businessState;
  if (businessZip !== undefined) updateData.businessZip = businessZip;
  if (businessCountry !== undefined) updateData.businessCountry = businessCountry;
  if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
  if (facebookUrl !== undefined) updateData.facebookUrl = facebookUrl;
  if (twitterUrl !== undefined) updateData.twitterUrl = twitterUrl;
  if (instagramUrl !== undefined) updateData.instagramUrl = instagramUrl;
  if (linkedinUrl !== undefined) updateData.linkedinUrl = linkedinUrl;
  if (youtubeUrl !== undefined) updateData.youtubeUrl = youtubeUrl;

  // Mark setup as complete when business details are saved
  updateData.setupComplete = true;

  const updatedTenant = await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
    select: {
      businessName: true,
      businessDescription: true,
      businessWebsite: true,
      businessPhone: true,
      businessAddress: true,
      businessCity: true,
      businessState: true,
      businessZip: true,
      businessCountry: true,
      contactPerson: true,
      facebookUrl: true,
      twitterUrl: true,
      instagramUrl: true,
      linkedinUrl: true,
      youtubeUrl: true,
      setupComplete: true,
    },
  });

  return NextResponse.json(updatedTenant);
}

// PUT /api/tenant/business - Update business details
export async function PUT(request) {
  try {
    return await updateBusinessDetails(request);
  } catch (error) {
    console.error("Error updating business details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/tenant/business - Update business details
export async function PATCH(request) {
  try {
    return await updateBusinessDetails(request);
  } catch (error) {
    console.error("Error updating business details:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
