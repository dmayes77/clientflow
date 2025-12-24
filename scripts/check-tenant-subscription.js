/**
 * Check tenant subscription status for debugging
 * Usage: node scripts/check-tenant-subscription.js <tenantId or email>
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkTenant() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error("Usage: node scripts/check-tenant-subscription.js <tenantId or email>");
    process.exit(1);
  }

  try {
    // Try to find tenant by ID or email
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier },
        ],
      },
      include: {
        plan: true,
      },
    });

    if (!tenant) {
      console.log(`❌ No tenant found with ID or email: ${identifier}`);
      return;
    }

    console.log("\n📊 Tenant Subscription Status:\n");
    console.log(`ID: ${tenant.id}`);
    console.log(`Name: ${tenant.name}`);
    console.log(`Business Name: ${tenant.businessName}`);
    console.log(`Email: ${tenant.email}`);
    console.log(`\n💳 Subscription Details:`);
    console.log(`Status: ${tenant.subscriptionStatus || "none"}`);
    console.log(`Current Period End: ${tenant.currentPeriodEnd || "not set"}`);
    console.log(`Stripe Customer ID: ${tenant.stripeCustomerId || "not set"}`);
    console.log(`Stripe Subscription ID: ${tenant.stripeSubscriptionId || "not set"}`);
    console.log(`\n📦 Plan:`);
    if (tenant.plan) {
      console.log(`Name: ${tenant.plan.name}`);
      console.log(`Slug: ${tenant.plan.slug}`);
      console.log(`Price (Monthly): $${(tenant.plan.priceMonthly / 100).toFixed(2)}`);
    } else {
      console.log(`Plan Type: ${tenant.planType || "not set"}`);
      console.log("⚠️  No plan relation found");
    }

    // Check if trial banner should show
    console.log(`\n🎯 Trial Banner Check:`);
    if (tenant.subscriptionStatus === "trialing") {
      if (tenant.currentPeriodEnd) {
        const now = new Date();
        const endDate = new Date(tenant.currentPeriodEnd);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        if (daysRemaining >= 0) {
          console.log(`✅ Banner SHOULD show - ${daysRemaining} days remaining`);
        } else {
          console.log(`❌ Banner will NOT show - trial ended ${Math.abs(daysRemaining)} days ago`);
        }
      } else {
        console.log("❌ Banner will NOT show - no currentPeriodEnd set");
      }
    } else {
      console.log(`❌ Banner will NOT show - status is "${tenant.subscriptionStatus}" (needs "trialing")`);
    }

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenant();
