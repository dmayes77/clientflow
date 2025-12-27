import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { updateTenantSchema, validateRequest } from "@/lib/validations";
import { getOrCreateTenant } from "@/lib/auth";

// GET /api/tenant - Get current tenant info
export async function GET() {

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Auto-create tenant if it doesn't exist
    const createdTenant = await getOrCreateTenant(orgId);

    // Re-fetch with all fields we need
    const tenant = await prisma.tenant.findUnique({
      where: { id: createdTenant.id },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
        planType: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
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
        timezone: true,
        slotInterval: true,
        breakDuration: true,
        breakStartTime: true,
        breakEndTime: true,
        bufferTime: true,
        defaultCalendarView: true,
        defaultTaxRate: true,
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        linkedinUrl: true,
        youtubeUrl: true,
        setupComplete: true,
        createdAt: true,
        updatedAt: true,
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            priceMonthly: true,
            priceYearly: true,
          },
        },
      },
    });

    // Fetch subscription details from Stripe if customer exists
    let subscriptionData = null;
    if (tenant.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: tenant.stripeCustomerId,
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          subscriptionData = {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          };
        }
      } catch (stripeError) {
        console.error("Error fetching subscription:", stripeError);
      }
    }

    return NextResponse.json({
      ...tenant,
      subscription: subscriptionData,
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper to generate slug from business name
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

// PATCH /api/tenant - Update tenant info
export async function PATCH(request) {
  try {
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
    const { success, data, errors } = validateRequest(body, updateTenantSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Generate slug from businessName if not already set
    if (data.businessName && !tenant.slug) {
      const baseSlug = generateSlug(data.businessName);
      // Check if slug is unique, append random suffix if needed
      let slug = baseSlug;
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.tenant.findUnique({ where: { slug } });
        if (!existing || existing.id === tenant.id) break;
        slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        attempts++;
      }
      data.slug = slug;
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data,
    });

    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
