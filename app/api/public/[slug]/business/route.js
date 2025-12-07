import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/business - Get business details only
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        businessName: true,
        businessDescription: true,
        logoUrl: true,
        businessPhone: true,
        businessWebsite: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        timezone: true,
        slotInterval: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: tenant.businessName,
      description: tenant.businessDescription,
      logo: tenant.logoUrl,
      phone: tenant.businessPhone,
      website: tenant.businessWebsite,
      address: {
        street: tenant.businessAddress,
        city: tenant.businessCity,
        state: tenant.businessState,
        zip: tenant.businessZip,
        country: tenant.businessCountry,
      },
      timezone: tenant.timezone,
      slotInterval: tenant.slotInterval,
      social: {
        facebook: tenant.facebookUrl,
        twitter: tenant.twitterUrl,
        instagram: tenant.instagramUrl,
        linkedin: tenant.linkedinUrl,
        youtube: tenant.youtubeUrl,
      },
    });
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
