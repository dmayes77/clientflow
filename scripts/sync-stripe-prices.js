/**
 * Sync plans with Stripe - Create products and prices
 * Usage: node scripts/sync-stripe-prices.js
 */

require('./load-env');

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function syncStripePrices() {
  try {
    console.log('🔄 Syncing plans with Stripe...\n');

    // Get all plans from database
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        priceMonthly: true,
        priceYearly: true,
        stripePriceId: true,
        stripePriceIdYearly: true,
      }
    });

    if (plans.length === 0) {
      console.log('❌ No plans found in database.');
      return;
    }

    for (const plan of plans) {
      console.log(`\n📦 Processing: ${plan.name}`);

      // Create or get Stripe product
      let product;
      try {
        // Search for existing product by name
        const existingProducts = await stripe.products.search({
          query: `name:'${plan.name}'`,
          limit: 1,
        });

        if (existingProducts.data.length > 0) {
          product = existingProducts.data[0];
          console.log(`  ✓ Found existing product: ${product.id}`);
        } else {
          // Create new product
          product = await stripe.products.create({
            name: plan.name,
            description: `${plan.name} subscription plan`,
            metadata: {
              planId: plan.id,
              planSlug: plan.slug,
            },
          });
          console.log(`  ✓ Created new product: ${product.id}`);
        }
      } catch (error) {
        console.error(`  ❌ Error with product: ${error.message}`);
        continue;
      }

      const updateData = {};

      // Create monthly price
      if (plan.priceMonthly) {
        try {
          const monthlyPrice = await stripe.prices.create({
            product: product.id,
            currency: 'usd',
            unit_amount: plan.priceMonthly,
            recurring: {
              interval: 'month',
            },
            metadata: {
              planId: plan.id,
              planSlug: plan.slug,
            },
          });
          updateData.stripePriceId = monthlyPrice.id;
          console.log(`  ✓ Created monthly price: ${monthlyPrice.id} ($${plan.priceMonthly / 100}/mo)`);
        } catch (error) {
          console.error(`  ❌ Error creating monthly price: ${error.message}`);
        }
      }

      // Create yearly price
      if (plan.priceYearly) {
        try {
          const yearlyPrice = await stripe.prices.create({
            product: product.id,
            currency: 'usd',
            unit_amount: plan.priceYearly,
            recurring: {
              interval: 'year',
            },
            metadata: {
              planId: plan.id,
              planSlug: plan.slug,
            },
          });
          updateData.stripePriceIdYearly = yearlyPrice.id;
          console.log(`  ✓ Created yearly price: ${yearlyPrice.id} ($${plan.priceYearly / 100}/yr)`);
        } catch (error) {
          console.error(`  ❌ Error creating yearly price: ${error.message}`);
        }
      }

      // Update database with new price IDs
      if (Object.keys(updateData).length > 0) {
        await prisma.plan.update({
          where: { id: plan.id },
          data: updateData,
        });
        console.log(`  ✓ Updated database with new price IDs`);
      }
    }

    console.log('\n✅ Sync complete!\n');

    // Show final state
    const updatedPlans = await prisma.plan.findMany({
      select: {
        name: true,
        slug: true,
        priceMonthly: true,
        priceYearly: true,
        stripePriceId: true,
        stripePriceIdYearly: true,
      }
    });

    console.log('Final plan configuration:');
    updatedPlans.forEach(plan => {
      console.log(`\n${plan.name}:`);
      console.log(`  Monthly: $${plan.priceMonthly / 100}/mo → ${plan.stripePriceId || 'NOT SET'}`);
      console.log(`  Yearly: $${plan.priceYearly / 100}/yr → ${plan.stripePriceIdYearly || 'NOT SET'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

syncStripePrices();
