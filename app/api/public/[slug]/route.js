import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug] - Get all public business info for a tenant
export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
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
        services: {
          where: { active: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
          },
        },
        packages: {
          where: { active: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            services: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    duration: true,
                  },
                },
              },
            },
          },
        },
        availability: {
          where: { active: true },
          orderBy: { dayOfWeek: "asc" },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            active: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Calculate total duration for packages
    const packagesWithDuration = tenant.packages.map((pkg) => ({
      ...pkg,
      totalDuration: pkg.services.reduce(
        (sum, ps) => sum + ps.service.duration,
        0
      ),
      services: pkg.services.map((ps) => ps.service),
    }));

    // Transform availability to use isOpen for frontend compatibility
    const availabilityWithIsOpen = tenant.availability.map((a) => ({
      dayOfWeek: a.dayOfWeek,
      startTime: a.startTime,
      endTime: a.endTime,
      isOpen: a.active,
    }));

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
      services: tenant.services,
      packages: packagesWithDuration,
      availability: availabilityWithIsOpen,
    });
  } catch (error) {
    console.error("Error fetching public business info:", error);
    return NextResponse.json(
      { error: "Failed to fetch business info" },
      { status: 500 }
    );
  }
}
