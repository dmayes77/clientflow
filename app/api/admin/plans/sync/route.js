import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Slugify helper
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// GET /api/admin/plans/sync - Fetch products from Stripe (preview)
export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Fetch all active products with recurring prices
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
      type: "recurring",
      limit: 100,
    });

    // Get existing plans from database
    const existingPlans = await prisma.plan.findMany();
    const existingProductIds = new Set(existingPlans.map(p => p.stripeProductId));

    // Group prices by product
    const pricesByProduct = {};
    for (const price of prices.data) {
      if (!pricesByProduct[price.product]) {
        pricesByProduct[price.product] = [];
      }
      pricesByProduct[price.product].push(price);
    }

    // Build list of Stripe products with their prices
    const stripeProducts = products.data
      .filter(product => pricesByProduct[product.id]) // Only products with recurring prices
      .map(product => {
        const productPrices = pricesByProduct[product.id] || [];
        const monthlyPrice = productPrices.find(p => p.recurring?.interval === "month");
        const yearlyPrice = productPrices.find(p => p.recurring?.interval === "year");

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          active: product.active,
          monthlyPrice: monthlyPrice ? {
            id: monthlyPrice.id,
            amount: monthlyPrice.unit_amount,
            currency: monthlyPrice.currency,
          } : null,
          yearlyPrice: yearlyPrice ? {
            id: yearlyPrice.id,
            amount: yearlyPrice.unit_amount,
            currency: yearlyPrice.currency,
          } : null,
          existsInDb: existingProductIds.has(product.id),
          metadata: product.metadata,
        };
      });

    return NextResponse.json({
      products: stripeProducts,
      existingCount: existingPlans.length,
      newCount: stripeProducts.filter(p => !p.existsInDb).length,
    });
  } catch (error) {
    console.error("Error fetching Stripe products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch Stripe products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/plans/sync - Import selected products from Stripe
export async function POST(request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { productIds, updateExisting = false } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "No product IDs provided" },
        { status: 400 }
      );
    }

    // Fetch selected products from Stripe
    const products = await Promise.all(
      productIds.map(id => stripe.products.retrieve(id))
    );

    // Fetch all active recurring prices
    const prices = await stripe.prices.list({
      active: true,
      type: "recurring",
      limit: 100,
    });

    // Group prices by product
    const pricesByProduct = {};
    for (const price of prices.data) {
      if (!pricesByProduct[price.product]) {
        pricesByProduct[price.product] = [];
      }
      pricesByProduct[price.product].push(price);
    }

    // Get highest sort order
    const lastPlan = await prisma.plan.findFirst({
      orderBy: { sortOrder: "desc" },
    });
    let sortOrder = (lastPlan?.sortOrder ?? -1) + 1;

    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: [],
    };

    for (const product of products) {
      try {
        const productPrices = pricesByProduct[product.id] || [];
        const monthlyPrice = productPrices.find(p => p.recurring?.interval === "month");
        const yearlyPrice = productPrices.find(p => p.recurring?.interval === "year");

        if (!monthlyPrice) {
          results.skipped.push({
            name: product.name,
            reason: "No monthly recurring price found",
          });
          continue;
        }

        const slug = product.metadata?.plan_slug || slugify(product.name);

        // Check if plan already exists
        const existingPlan = await prisma.plan.findFirst({
          where: {
            OR: [
              { stripeProductId: product.id },
              { slug },
            ],
          },
        });

        if (existingPlan) {
          if (updateExisting) {
            // Update existing plan
            const updatedPlan = await prisma.plan.update({
              where: { id: existingPlan.id },
              data: {
                name: product.name,
                description: product.description || null,
                priceMonthly: monthlyPrice.unit_amount,
                priceYearly: yearlyPrice?.unit_amount || null,
                stripePriceId: monthlyPrice.id,
                stripePriceIdYearly: yearlyPrice?.id || null,
                active: product.active,
              },
            });
            results.updated.push(updatedPlan);
          } else {
            results.skipped.push({
              name: product.name,
              reason: "Already exists in database",
            });
          }
          continue;
        }

        // Create new plan
        const newPlan = await prisma.plan.create({
          data: {
            name: product.name,
            slug,
            description: product.description || null,
            features: [], // Can be filled in later via UI
            priceMonthly: monthlyPrice.unit_amount,
            priceYearly: yearlyPrice?.unit_amount || null,
            stripeProductId: product.id,
            stripePriceId: monthlyPrice.id,
            stripePriceIdYearly: yearlyPrice?.id || null,
            active: product.active,
            sortOrder: sortOrder++,
          },
        });
        results.created.push(newPlan);
      } catch (err) {
        results.errors.push({
          name: product.name,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        created: results.created.length,
        updated: results.updated.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
    });
  } catch (error) {
    console.error("Error syncing Stripe products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync Stripe products" },
      { status: 500 }
    );
  }
}
