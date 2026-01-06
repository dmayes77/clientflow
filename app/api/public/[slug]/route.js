import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/public/[slug] - Get public business info
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
        businessName: true,
        businessDescription: true,
        logoUrl: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        businessCountry: true,
        businessWebsite: true,
        timezone: true,
        slotInterval: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        // Payment settings
        requirePayment: true,
        paymentType: true,
        depositType: true,
        depositValue: true,
        payInFullDiscount: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        serviceCategories: {
          select: {
            id: true,
            name: true,
            description: true,
            color: true,
          },
          orderBy: { name: "asc" },
        },
        services: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            includes: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
            images: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                url: true,
                alt: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
        packages: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
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
            images: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                url: true,
                alt: true,
              },
            },
          },
          orderBy: { name: "asc" },
        },
        availability: {
          where: { active: true },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            active: true,
          },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Determine if payment is enabled (require payment + Stripe connected)
    const paymentEnabled = tenant.requirePayment &&
      tenant.stripeAccountId &&
      tenant.stripeAccountStatus === "active";

    // Transform the data
    const response = {
      business: {
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
        social: {
          facebook: tenant.facebookUrl,
          twitter: tenant.twitterUrl,
          instagram: tenant.instagramUrl,
          linkedin: tenant.linkedinUrl,
          youtube: tenant.youtubeUrl,
        },
        timezone: tenant.timezone,
        slotInterval: tenant.slotInterval,
      },
      payment: paymentEnabled
        ? {
            enabled: true,
            type: tenant.paymentType || "full",
            deposit: tenant.paymentType === "deposit"
              ? {
                  type: tenant.depositType || "percentage",
                  value: tenant.depositValue || 50,
                }
              : null,
            payInFullDiscount: tenant.payInFullDiscount || 0,
          }
        : {
            enabled: false,
          },
      categories: tenant.serviceCategories,
      services: tenant.services,
      packages: tenant.packages.map((pkg) => ({
        ...pkg,
        services: pkg.services.map((ps) => ps.service),
        totalDuration: pkg.services.reduce((sum, ps) => sum + ps.service.duration, 0),
      })),
      availability: tenant.availability.map((a) => ({
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isOpen: a.active,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching public business info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
