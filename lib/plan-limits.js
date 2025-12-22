import { prisma } from "@/lib/prisma";

/**
 * Get tenant with their plan limits
 */
export async function getTenantWithPlan(tenantId) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          maxContacts: true,
          maxBookings: true,
          maxServices: true,
        },
      },
    },
  });
}

/**
 * Check if tenant has reached their contact limit
 * @returns {{ allowed: boolean, current: number, limit: number | null, message?: string }}
 */
export async function checkContactLimit(tenantId) {
  const tenant = await getTenantWithPlan(tenantId);

  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, message: "Tenant not found" };
  }

  const limit = tenant.plan?.maxContacts ?? null;

  // No limit set = unlimited
  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  const currentCount = await prisma.contact.count({
    where: { tenantId },
  });

  if (currentCount >= limit) {
    return {
      allowed: false,
      current: currentCount,
      limit,
      message: `Contact limit reached (${currentCount}/${limit}). Upgrade your plan for more contacts.`,
    };
  }

  return { allowed: true, current: currentCount, limit };
}

/**
 * Check if tenant has reached their service limit
 * @returns {{ allowed: boolean, current: number, limit: number | null, message?: string }}
 */
export async function checkServiceLimit(tenantId) {
  const tenant = await getTenantWithPlan(tenantId);

  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, message: "Tenant not found" };
  }

  const limit = tenant.plan?.maxServices ?? null;

  // No limit set = unlimited
  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  const currentCount = await prisma.service.count({
    where: { tenantId },
  });

  if (currentCount >= limit) {
    return {
      allowed: false,
      current: currentCount,
      limit,
      message: `Service limit reached (${currentCount}/${limit}). Upgrade your plan for more services.`,
    };
  }

  return { allowed: true, current: currentCount, limit };
}

/**
 * Check if tenant has reached their booking limit (per billing period)
 * @returns {{ allowed: boolean, current: number, limit: number | null, message?: string }}
 */
export async function checkBookingLimit(tenantId) {
  const tenant = await getTenantWithPlan(tenantId);

  if (!tenant) {
    return { allowed: false, current: 0, limit: 0, message: "Tenant not found" };
  }

  const limit = tenant.plan?.maxBookings ?? null;

  // No limit set = unlimited
  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  // Count bookings in current billing period (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCount = await prisma.booking.count({
    where: {
      tenantId,
      createdAt: { gte: startOfMonth },
    },
  });

  if (currentCount >= limit) {
    return {
      allowed: false,
      current: currentCount,
      limit,
      message: `Monthly booking limit reached (${currentCount}/${limit}). Upgrade your plan for more bookings.`,
    };
  }

  return { allowed: true, current: currentCount, limit };
}

/**
 * Get all plan limits and current usage for a tenant
 * Useful for displaying usage in the dashboard
 */
export async function getPlanUsage(tenantId) {
  const tenant = await getTenantWithPlan(tenantId);

  if (!tenant) {
    return null;
  }

  // Count all resources
  const [contactCount, serviceCount, bookingCount] = await Promise.all([
    prisma.contact.count({ where: { tenantId } }),
    prisma.service.count({ where: { tenantId } }),
    // Bookings this month
    prisma.booking.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  return {
    plan: tenant.plan,
    usage: {
      contacts: {
        current: contactCount,
        limit: tenant.plan?.maxContacts ?? null,
        percentage: tenant.plan?.maxContacts
          ? Math.round((contactCount / tenant.plan.maxContacts) * 100)
          : null,
      },
      services: {
        current: serviceCount,
        limit: tenant.plan?.maxServices ?? null,
        percentage: tenant.plan?.maxServices
          ? Math.round((serviceCount / tenant.plan.maxServices) * 100)
          : null,
      },
      bookings: {
        current: bookingCount,
        limit: tenant.plan?.maxBookings ?? null,
        percentage: tenant.plan?.maxBookings
          ? Math.round((bookingCount / tenant.plan.maxBookings) * 100)
          : null,
        period: "month",
      },
    },
  };
}

/**
 * Assign default plan to tenant on signup
 */
export async function assignDefaultPlan(tenantId) {
  const defaultPlan = await prisma.plan.findFirst({
    where: { isDefault: true, active: true },
  });

  if (defaultPlan) {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { planId: defaultPlan.id },
    });
  }

  return defaultPlan;
}
