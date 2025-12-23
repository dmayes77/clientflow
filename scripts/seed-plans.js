/**
 * Seed Plans Script
 *
 * Run this to populate plans in your database.
 *
 * Usage:
 *   node scripts/seed-plans.js
 *
 * IMPORTANT: Update the Stripe Product/Price IDs with your actual Stripe IDs before running
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const plans = [
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
    priceYearly: 29000, // $290/year (save ~17%)
    stripeProductId: "prod_REPLACE_WITH_YOUR_STRIPE_PRODUCT_ID",
    stripePriceId: "price_REPLACE_WITH_YOUR_STRIPE_MONTHLY_PRICE_ID",
    stripePriceIdYearly: "price_REPLACE_WITH_YOUR_STRIPE_YEARLY_PRICE_ID",
    maxContacts: null, // unlimited
    maxBookings: null, // unlimited
    maxServices: null, // unlimited
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
    priceYearly: 99000, // $990/year (save ~17%)
    stripeProductId: "prod_REPLACE_WITH_YOUR_STRIPE_PRODUCT_ID_2",
    stripePriceId: "price_REPLACE_WITH_YOUR_STRIPE_MONTHLY_PRICE_ID_2",
    stripePriceIdYearly: "price_REPLACE_WITH_YOUR_STRIPE_YEARLY_PRICE_ID_2",
    maxContacts: null, // unlimited
    maxBookings: null, // unlimited
    maxServices: null, // unlimited
    active: true,
    isDefault: false,
    sortOrder: 2,
  },
];

async function seed() {
  console.log("🌱 Seeding plans...");

  for (const plan of plans) {
    // Check if plan already exists
    const existing = await prisma.plan.findUnique({
      where: { slug: plan.slug },
    });

    if (existing) {
      console.log(`⏭️  Plan "${plan.name}" already exists, skipping...`);
      continue;
    }

    // Create the plan
    const created = await prisma.plan.create({
      data: plan,
    });

    console.log(`✅ Created plan: ${created.name} (${created.slug})`);
  }

  console.log("\n✨ Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("❌ Error seeding plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
