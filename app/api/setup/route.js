import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/setup - One-time setup endpoint to create initial plans
 *
 * This endpoint:
 * 1. Only works when NO plans exist in the database (safety measure)
 * 2. Requires SETUP_SECRET token in Authorization header
 * 3. Creates default Professional and Platform plans
 *
 * Usage:
 * POST /api/setup
 * Headers: { "Authorization": "Bearer YOUR_SETUP_SECRET" }
 * Body: { plans: [...] } (optional, uses defaults if not provided)
 */
export async function POST(request) {
  try {
    // Check setup secret
    const authHeader = request.headers.get("Authorization");
    const setupSecret = process.env.SETUP_SECRET;

    if (!setupSecret) {
      return NextResponse.json(
        { error: "Setup not configured. Add SETUP_SECRET to environment variables." },
        { status: 500 }
      );
    }

    const token = authHeader?.replace("Bearer ", "");
    if (token !== setupSecret) {
      return NextResponse.json(
        { error: "Invalid setup token" },
        { status: 401 }
      );
    }

    // Safety check: Only allow if NO plans exist
    const existingPlansCount = await prisma.plan.count();
    if (existingPlansCount > 0) {
      return NextResponse.json(
        {
          error: "Setup already completed. Plans already exist in database.",
          existingPlans: existingPlansCount,
        },
        { status: 400 }
      );
    }

    // Get plans from request body or use defaults
    const body = await request.json().catch(() => ({}));
    const plansToCreate = body.plans || [
      {
        name: "Professional",
        slug: "professional",
        description: "Perfect for growing businesses",
        features: [
          "Unlimited contacts",
          "Unlimited bookings",
          "Unlimited services",
          "Advanced calendar",
          "Invoicing",
          "Payments",
          "Email templates",
          "Workflows",
          "API access",
          "Priority support",
        ],
        priceMonthly: 2900, // $29/month
        priceYearly: 29000, // $290/year
        stripeProductId: body.professionalProductId || "prod_TEMP_REPLACE_ME",
        stripePriceId: body.professionalPriceId || "price_TEMP_REPLACE_ME",
        stripePriceIdYearly: body.professionalPriceIdYearly || null,
        maxContacts: null,
        maxBookings: null,
        maxServices: null,
        active: true,
        isDefault: true,
        sortOrder: 1,
      },
      {
        name: "Platform",
        slug: "platform",
        description: "All features included",
        features: [
          "Everything in Professional",
          "White-label branding",
          "Custom domain",
          "Advanced reporting",
          "Multi-location support",
          "Dedicated account manager",
        ],
        priceMonthly: 9900, // $99/month
        priceYearly: 99000, // $990/year
        stripeProductId: body.platformProductId || "prod_TEMP_REPLACE_ME_2",
        stripePriceId: body.platformPriceId || "price_TEMP_REPLACE_ME_2",
        stripePriceIdYearly: body.platformPriceIdYearly || null,
        maxContacts: null,
        maxBookings: null,
        maxServices: null,
        active: true,
        isDefault: false,
        sortOrder: 2,
      },
    ];

    // Create plans
    const createdPlans = [];
    for (const planData of plansToCreate) {
      const plan = await prisma.plan.create({
        data: planData,
      });
      createdPlans.push(plan);
    }

    return NextResponse.json({
      success: true,
      message: "Initial plans created successfully",
      plans: createdPlans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        active: p.active,
        isDefault: p.isDefault,
      })),
      warning: "Remember to update Stripe Product/Price IDs in the admin panel!",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
