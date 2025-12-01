import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug]/business - Get just business info for a tenant
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        name: true,
        businessName: true,
        businessDescription: true,
        businessPhone: true,
        businessWebsite: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        contactPerson: true,
        logoUrl: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        slug: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        name: tenant.businessName || tenant.name,
        slug: tenant.slug,
        description: tenant.businessDescription,
        logo: tenant.logoUrl,
        phone: tenant.businessPhone,
        website: tenant.businessWebsite,
        contactPerson: tenant.contactPerson,
        address: {
          street: tenant.businessAddress,
          city: tenant.businessCity,
          state: tenant.businessState,
          zip: tenant.businessZip,
          country: tenant.businessCountry,
        },
        social: {
          facebook: tenant.facebookUrl,
          twitter: tenant.twitterUrl,
          instagram: tenant.instagramUrl,
          linkedin: tenant.linkedinUrl,
          youtube: tenant.youtubeUrl,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching business info:", error);
    return NextResponse.json(
      { error: "Failed to fetch business info" },
      { status: 500 }
    );
  }
}
