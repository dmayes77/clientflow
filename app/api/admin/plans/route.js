import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Verify admin access
function isAdmin(userId) {
  const adminIds = process.env.ADMIN_USER_IDS?.split(",") || [];
  return adminIds.includes(userId);
}

// Slugify helper
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/plans - List all plans
export async function GET() {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}

// POST /api/admin/plans - Create a new plan with Stripe Product + Price
export async function POST(request) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      features = [],
      priceMonthly,
      priceYearly,
      maxContacts,
      maxBookings,
      maxServices,
      isDefault = false,
    } = body;

    // Validate required fields
    if (!name || !priceMonthly) {
      return NextResponse.json(
        { error: "Name and monthly price are required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    // Check if slug already exists
    const existingPlan = await prisma.plan.findUnique({ where: { slug } });
    if (existingPlan) {
      return NextResponse.json(
        { error: "A plan with this name already exists" },
        { status: 400 }
      );
    }

    // 1. Create Stripe Product
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
      metadata: {
        plan_slug: slug,
      },
    });

    // 2. Create Stripe Price (monthly)
    const stripeMonthlyPrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: priceMonthly,
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        plan_slug: slug,
        billing_period: "monthly",
      },
    });

    // 3. Create Stripe Price (yearly) if provided
    let stripeYearlyPrice = null;
    if (priceYearly) {
      stripeYearlyPrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: priceYearly,
        currency: "usd",
        recurring: {
          interval: "year",
        },
        metadata: {
          plan_slug: slug,
          billing_period: "yearly",
        },
      });
    }

    // 4. Get the highest sortOrder
    const lastPlan = await prisma.plan.findFirst({
      orderBy: { sortOrder: "desc" },
    });
    const sortOrder = (lastPlan?.sortOrder ?? -1) + 1;

    // 5. If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.plan.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    // 6. Create plan in database
    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        description,
        features,
        priceMonthly,
        priceYearly,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripeMonthlyPrice.id,
        stripePriceIdYearly: stripeYearlyPrice?.id,
        maxContacts,
        maxBookings,
        maxServices,
        isDefault,
        sortOrder,
      },
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create plan" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/plans - Update a plan
export async function PATCH(request) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      features,
      priceMonthly,
      priceYearly,
      maxContacts,
      maxBookings,
      maxServices,
      active,
      isDefault,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const existingPlan = await prisma.plan.findUnique({ where: { id } });
    if (!existingPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Update Stripe Product if name or description changed
    if (name !== existingPlan.name || description !== existingPlan.description) {
      await stripe.products.update(existingPlan.stripeProductId, {
        name: name || existingPlan.name,
        description: description || existingPlan.description || undefined,
      });
    }

    // If price changed, we need to create new Stripe Prices
    // (Stripe prices are immutable, so we create new, set as default, then archive old)
    let newStripePriceId = existingPlan.stripePriceId;
    let newStripePriceIdYearly = existingPlan.stripePriceIdYearly;
    const oldPriceId = existingPlan.stripePriceId;
    const oldYearlyPriceId = existingPlan.stripePriceIdYearly;

    if (priceMonthly && priceMonthly !== existingPlan.priceMonthly) {
      // Create new price first
      const newPrice = await stripe.prices.create({
        product: existingPlan.stripeProductId,
        unit_amount: priceMonthly,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: {
          plan_slug: existingPlan.slug,
          billing_period: "monthly",
        },
      });
      newStripePriceId = newPrice.id;

      // Set new price as the default price for the product
      await stripe.products.update(existingPlan.stripeProductId, {
        default_price: newPrice.id,
      });

      // Now we can archive the old price
      await stripe.prices.update(oldPriceId, { active: false });
    }

    if (priceYearly !== undefined && priceYearly !== existingPlan.priceYearly) {
      // Create new yearly price if value provided
      if (priceYearly) {
        const newYearlyPrice = await stripe.prices.create({
          product: existingPlan.stripeProductId,
          unit_amount: priceYearly,
          currency: "usd",
          recurring: { interval: "year" },
          metadata: {
            plan_slug: existingPlan.slug,
            billing_period: "yearly",
          },
        });
        newStripePriceIdYearly = newYearlyPrice.id;
      } else {
        newStripePriceIdYearly = null;
      }

      // Archive old yearly price if it exists (yearly prices aren't default, so this is safe)
      if (oldYearlyPriceId) {
        await stripe.prices.update(oldYearlyPriceId, { active: false });
      }
    }

    // If product is being deactivated, archive it in Stripe
    if (active === false && existingPlan.active === true) {
      await stripe.products.update(existingPlan.stripeProductId, { active: false });
    } else if (active === true && existingPlan.active === false) {
      await stripe.products.update(existingPlan.stripeProductId, { active: true });
    }

    // If setting as default, unset others
    if (isDefault && !existingPlan.isDefault) {
      await prisma.plan.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Update plan in database
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(features !== undefined && { features }),
        ...(priceMonthly && { priceMonthly }),
        ...(priceYearly !== undefined && { priceYearly }),
        ...(newStripePriceId !== existingPlan.stripePriceId && { stripePriceId: newStripePriceId }),
        ...(newStripePriceIdYearly !== existingPlan.stripePriceIdYearly && { stripePriceIdYearly: newStripePriceIdYearly }),
        ...(maxContacts !== undefined && { maxContacts }),
        ...(maxBookings !== undefined && { maxBookings }),
        ...(maxServices !== undefined && { maxServices }),
        ...(active !== undefined && { active }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/plans - Archive a plan
export async function DELETE(request) {
  const { userId } = await auth();

  if (!userId || !isAdmin(userId)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Check if any tenants are using this plan
    const tenantsUsingPlan = await prisma.tenant.count({
      where: { planType: plan.slug },
    });

    if (tenantsUsingPlan > 0) {
      // Don't delete, just archive
      await stripe.products.update(plan.stripeProductId, { active: false });

      const archivedPlan = await prisma.plan.update({
        where: { id },
        data: { active: false },
      });

      return NextResponse.json({
        plan: archivedPlan,
        message: `Plan archived. ${tenantsUsingPlan} tenant(s) are still using this plan.`,
      });
    }

    // Archive in Stripe (don't delete, just deactivate)
    await stripe.products.update(plan.stripeProductId, { active: false });
    if (plan.stripePriceId) {
      await stripe.prices.update(plan.stripePriceId, { active: false });
    }
    if (plan.stripePriceIdYearly) {
      await stripe.prices.update(plan.stripePriceIdYearly, { active: false });
    }

    // Delete from database
    await prisma.plan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete plan" },
      { status: 500 }
    );
  }
}
