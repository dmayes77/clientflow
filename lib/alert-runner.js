import { prisma } from "@/lib/prisma";
import { sendPushForAlert } from "@/lib/push-notifications";

/**
 * Replace placeholders in alert text with tenant data
 */
function replacePlaceholders(text, tenant) {
  if (!text) return text;

  return text
    .replace(/\{\{tenantName\}\}/g, tenant.name || "")
    .replace(/\{\{businessName\}\}/g, tenant.businessName || tenant.name || "")
    .replace(/\{\{email\}\}/g, tenant.email || "")
    .replace(/\{\{daysRemaining\}\}/g, getDaysUntilExpiry(tenant).toString())
    .replace(/\{\{expiryDate\}\}/g, tenant.currentPeriodEnd ? new Date(tenant.currentPeriodEnd).toLocaleDateString() : "");
}

/**
 * Calculate days until trial/subscription expires
 */
function getDaysUntilExpiry(tenant) {
  if (!tenant.currentPeriodEnd) return 0;
  const now = new Date();
  const expiry = new Date(tenant.currentPeriodEnd);
  const diffTime = expiry.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if alert was recently sent to tenant (within cooldown period)
 */
async function wasRecentlySent(ruleId, tenantId, cooldownHours) {
  const cooldownDate = new Date();
  cooldownDate.setHours(cooldownDate.getHours() - cooldownHours);

  const recentLog = await prisma.alertRuleLog.findFirst({
    where: {
      ruleId,
      tenantId,
      createdAt: { gte: cooldownDate },
      status: "sent",
    },
  });

  return !!recentLog;
}

/**
 * Create an alert for a tenant based on a rule
 */
async function createAlertForTenant(rule, tenant) {
  // Check cooldown
  if (await wasRecentlySent(rule.id, tenant.id, rule.cooldownHours)) {
    return { status: "skipped", reason: "cooldown" };
  }

  try {
    // Create the alert
    const alert = await prisma.alert.create({
      data: {
        tenantId: tenant.id,
        type: rule.scheduleType || rule.eventType || "system",
        severity: rule.alertType,
        title: replacePlaceholders(rule.alertTitle, tenant),
        message: replacePlaceholders(rule.alertMessage, tenant),
        actionUrl: replacePlaceholders(rule.actionUrl, tenant),
        actionLabel: rule.actionLabel,
      },
    });

    // Log the alert
    await prisma.alertRuleLog.create({
      data: {
        ruleId: rule.id,
        tenantId: tenant.id,
        alertId: alert.id,
        status: "sent",
      },
    });

    // Update rule stats
    await prisma.alertRule.update({
      where: { id: rule.id },
      data: {
        alertsSent: { increment: 1 },
        lastRunAt: new Date(),
      },
    });

    // Send push notification (non-blocking)
    sendPushForAlert(alert, tenant.id).catch((err) => {
      console.error("Error sending push notification:", err);
    });

    return { status: "sent", alertId: alert.id };
  } catch (error) {
    // Log the failure
    await prisma.alertRuleLog.create({
      data: {
        ruleId: rule.id,
        tenantId: tenant.id,
        status: "failed",
        error: error.message,
      },
    });

    return { status: "failed", error: error.message };
  }
}

/**
 * Apply custom filters to a list of tenants
 * @param {Array} tenants - Initial list of tenants
 * @param {Object} filters - Filter configuration
 * @returns {Array} Filtered tenants
 */
async function applyFilters(tenants, filters) {
  if (!filters || Object.keys(filters).length === 0) {
    return tenants;
  }

  let filtered = [...tenants];

  // Filter by plan IDs
  if (filters.planIds && filters.planIds.length > 0) {
    filtered = filtered.filter((t) => t.planId && filters.planIds.includes(t.planId));
  }

  // Filter by subscription statuses
  if (filters.subscriptionStatuses && filters.subscriptionStatuses.length > 0) {
    filtered = filtered.filter((t) => filters.subscriptionStatuses.includes(t.subscriptionStatus));
  }

  // Filter by minimum tenant age (days)
  if (filters.minTenantAgeDays && filters.minTenantAgeDays > 0) {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - filters.minTenantAgeDays);
    filtered = filtered.filter((t) => new Date(t.createdAt) <= minDate);
  }

  // Filter by has payment method (stripeCustomerId exists)
  if (filters.hasPaymentMethod === true) {
    filtered = filtered.filter((t) => !!t.stripeCustomerId);
  } else if (filters.hasPaymentMethod === false) {
    filtered = filtered.filter((t) => !t.stripeCustomerId);
  }

  // Filter by booking count (requires additional query)
  if (filters.minBookings !== undefined || filters.maxBookings !== undefined) {
    const tenantIds = filtered.map((t) => t.id);
    const bookingCounts = await prisma.booking.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds } },
      _count: { id: true },
    });

    const countMap = new Map(bookingCounts.map((b) => [b.tenantId, b._count.id]));

    filtered = filtered.filter((t) => {
      const count = countMap.get(t.id) || 0;
      if (filters.minBookings !== undefined && count < filters.minBookings) return false;
      if (filters.maxBookings !== undefined && count > filters.maxBookings) return false;
      return true;
    });
  }

  // Filter by contact count
  if (filters.minContacts !== undefined || filters.maxContacts !== undefined) {
    const tenantIds = filtered.map((t) => t.id);
    const contactCounts = await prisma.contact.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds } },
      _count: { id: true },
    });

    const countMap = new Map(contactCounts.map((c) => [c.tenantId, c._count.id]));

    filtered = filtered.filter((t) => {
      const count = countMap.get(t.id) || 0;
      if (filters.minContacts !== undefined && count < filters.minContacts) return false;
      if (filters.maxContacts !== undefined && count > filters.maxContacts) return false;
      return true;
    });
  }

  // Filter by Stripe Connect status
  if (filters.stripeConnectStatus) {
    if (filters.stripeConnectStatus === "connected") {
      filtered = filtered.filter((t) => t.stripeOnboardingComplete === true);
    } else if (filters.stripeConnectStatus === "not_connected") {
      filtered = filtered.filter((t) => !t.stripeAccountId);
    } else if (filters.stripeConnectStatus === "pending") {
      filtered = filtered.filter((t) => t.stripeAccountId && !t.stripeOnboardingComplete);
    }
  }

  // Filter by setup completion
  if (filters.setupComplete === true) {
    filtered = filtered.filter((t) => t.setupComplete === true);
  } else if (filters.setupComplete === false) {
    filtered = filtered.filter((t) => t.setupComplete !== true);
  }

  return filtered;
}

/**
 * Get tenants matching schedule type conditions
 */
async function getTenantsForScheduleType(scheduleType, filters = null) {
  const now = new Date();
  let tenants = [];

  switch (scheduleType) {
    case "trial_expiring_7_days": {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "trialing",
          currentPeriodEnd: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      break;
    }

    case "trial_expiring_3_days": {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 3);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "trialing",
          currentPeriodEnd: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      break;
    }

    case "trial_expiring_1_day": {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 1);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "trialing",
          currentPeriodEnd: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      break;
    }

    case "trial_expired": {
      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "trialing",
          currentPeriodEnd: { lt: now },
        },
      });
      break;
    }

    case "subscription_expiring_7_days": {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "active",
          currentPeriodEnd: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });
      break;
    }

    case "payment_past_due": {
      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: "past_due",
        },
      });
      break;
    }

    case "inactive_30_days": {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get tenants with no bookings in last 30 days
      const tenantsWithRecentBookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { tenantId: true },
        distinct: ["tenantId"],
      });

      const activeIds = tenantsWithRecentBookings.map((t) => t.tenantId);

      tenants = await prisma.tenant.findMany({
        where: {
          subscriptionStatus: { in: ["active", "trialing"] },
          id: { notIn: activeIds },
          createdAt: { lt: thirtyDaysAgo }, // Only tenants older than 30 days
        },
      });
      break;
    }

    default:
      tenants = [];
  }

  // Apply custom filters if provided
  if (filters) {
    tenants = await applyFilters(tenants, filters);
  }

  return tenants;
}

/**
 * Run all scheduled alert rules
 * Called by cron job
 */
export async function runScheduledAlerts() {
  const rules = await prisma.alertRule.findMany({
    where: {
      active: true,
      triggerType: "schedule",
      scheduleType: { not: null },
    },
  });

  const results = {
    rulesProcessed: 0,
    alertsSent: 0,
    alertsSkipped: 0,
    alertsFailed: 0,
    details: [],
  };

  for (const rule of rules) {
    const tenants = await getTenantsForScheduleType(rule.scheduleType, rule.filters);

    for (const tenant of tenants) {
      const result = await createAlertForTenant(rule, tenant);

      if (result.status === "sent") results.alertsSent++;
      else if (result.status === "skipped") results.alertsSkipped++;
      else if (result.status === "failed") results.alertsFailed++;

      results.details.push({
        ruleId: rule.id,
        ruleName: rule.name,
        tenantId: tenant.id,
        ...result,
      });
    }

    results.rulesProcessed++;
  }

  return results;
}

/**
 * Trigger event-based alert for a specific tenant
 * Called by webhooks
 */
export async function triggerEventAlert(eventType, tenantId, metadata = {}) {
  const rules = await prisma.alertRule.findMany({
    where: {
      active: true,
      triggerType: "event",
      eventType,
    },
  });

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return { success: false, error: "Tenant not found" };
  }

  // Merge metadata into tenant for placeholders
  const enrichedTenant = { ...tenant, ...metadata };

  const results = [];
  for (const rule of rules) {
    const result = await createAlertForTenant(rule, enrichedTenant);
    results.push({
      ruleId: rule.id,
      ruleName: rule.name,
      ...result,
    });
  }

  return { success: true, results };
}

/**
 * Trigger alert by Stripe customer ID (for webhook handlers)
 */
export async function triggerEventAlertByStripeCustomer(eventType, stripeCustomerId, metadata = {}) {
  const tenant = await prisma.tenant.findUnique({
    where: { stripeCustomerId },
  });

  if (!tenant) {
    return { success: false, error: "Tenant not found for Stripe customer" };
  }

  return triggerEventAlert(eventType, tenant.id, metadata);
}

/**
 * Get available schedule types for UI dropdown
 */
export function getScheduleTypes() {
  return [
    { value: "trial_expiring_7_days", label: "Trial expiring in 7 days" },
    { value: "trial_expiring_3_days", label: "Trial expiring in 3 days" },
    { value: "trial_expiring_1_day", label: "Trial expiring tomorrow" },
    { value: "trial_expired", label: "Trial expired" },
    { value: "subscription_expiring_7_days", label: "Subscription expiring in 7 days" },
    { value: "payment_past_due", label: "Payment past due" },
    { value: "inactive_30_days", label: "Inactive for 30 days" },
  ];
}

/**
 * Get available event types for UI dropdown
 */
export function getEventTypes() {
  return [
    { value: "payment_failed", label: "Payment failed" },
    { value: "payment_succeeded", label: "Payment succeeded" },
    { value: "subscription_cancelled", label: "Subscription cancelled" },
    { value: "subscription_upgraded", label: "Subscription upgraded" },
    { value: "subscription_downgraded", label: "Subscription downgraded" },
    { value: "dispute_created", label: "Payment dispute created" },
    { value: "dispute_won", label: "Payment dispute won" },
    { value: "dispute_lost", label: "Payment dispute lost" },
    { value: "trial_started", label: "Trial started" },
    { value: "onboarding_completed", label: "Onboarding completed" },
  ];
}

/**
 * Get available filter options for UI
 */
export function getFilterOptions() {
  return {
    subscriptionStatuses: [
      { value: "trialing", label: "Trial" },
      { value: "active", label: "Active" },
      { value: "past_due", label: "Past Due" },
      { value: "canceled", label: "Canceled" },
      { value: "incomplete", label: "Incomplete" },
    ],
    stripeConnectStatuses: [
      { value: "connected", label: "Stripe Connected" },
      { value: "pending", label: "Stripe Pending" },
      { value: "not_connected", label: "Not Connected" },
    ],
    booleanOptions: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ],
  };
}

/**
 * Seed default alert rules
 */
export async function seedDefaultAlertRules() {
  const defaultRules = [
    // Trial expiration alerts
    {
      name: "Trial Expiring in 7 Days",
      description: "Remind tenants their trial is expiring in one week",
      triggerType: "schedule",
      scheduleType: "trial_expiring_7_days",
      alertType: "info",
      alertTitle: "Your trial expires in 7 days",
      alertMessage: "Hi {{businessName}}, your free trial ends on {{expiryDate}}. Upgrade now to keep access to all features.",
      actionUrl: "/dashboard/billing",
      actionLabel: "Upgrade Now",
      cooldownHours: 48,
    },
    {
      name: "Trial Expiring in 3 Days",
      description: "Urgent reminder - trial expiring soon",
      triggerType: "schedule",
      scheduleType: "trial_expiring_3_days",
      alertType: "warning",
      alertTitle: "Your trial expires in 3 days",
      alertMessage: "Your ClientFlow trial ends on {{expiryDate}}. Don't lose access to your bookings and client data - upgrade today!",
      actionUrl: "/dashboard/billing",
      actionLabel: "Upgrade Now",
      cooldownHours: 24,
    },
    {
      name: "Trial Expiring Tomorrow",
      description: "Final reminder - trial expires tomorrow",
      triggerType: "schedule",
      scheduleType: "trial_expiring_1_day",
      alertType: "error",
      alertTitle: "Your trial expires tomorrow!",
      alertMessage: "This is your last chance to upgrade before losing access. Your data will be preserved for 30 days after expiration.",
      actionUrl: "/dashboard/billing",
      actionLabel: "Upgrade Now",
      cooldownHours: 12,
    },
    {
      name: "Trial Expired",
      description: "Trial has expired - prompt to upgrade",
      triggerType: "schedule",
      scheduleType: "trial_expired",
      alertType: "critical",
      alertTitle: "Your trial has expired",
      alertMessage: "Your ClientFlow trial has ended. Upgrade now to restore access to your account and data.",
      actionUrl: "/dashboard/billing",
      actionLabel: "Upgrade Now",
      cooldownHours: 24,
    },
    // Payment alerts
    {
      name: "Payment Failed",
      description: "Alert when a payment fails",
      triggerType: "event",
      eventType: "payment_failed",
      alertType: "error",
      alertTitle: "Payment failed",
      alertMessage: "We couldn't process your payment. Please update your payment method to avoid service interruption.",
      actionUrl: "/dashboard/billing",
      actionLabel: "Update Payment",
      cooldownHours: 4,
    },
    {
      name: "Payment Past Due",
      description: "Scheduled check for past due payments",
      triggerType: "schedule",
      scheduleType: "payment_past_due",
      alertType: "critical",
      alertTitle: "Your account is past due",
      alertMessage: "Your subscription payment is overdue. Please update your payment method immediately to avoid account suspension.",
      actionUrl: "/dashboard/billing",
      actionLabel: "Update Payment",
      cooldownHours: 24,
    },
    // Dispute alerts
    {
      name: "Payment Dispute Created",
      description: "Alert when a customer disputes a payment",
      triggerType: "event",
      eventType: "dispute_created",
      alertType: "critical",
      alertTitle: "Payment dispute received",
      alertMessage: "A customer has disputed a payment. Review the dispute details and respond promptly to avoid losing the funds.",
      actionUrl: "/dashboard/payments",
      actionLabel: "View Dispute",
      cooldownHours: 1,
    },
    // Engagement alerts
    {
      name: "Inactive Account",
      description: "Re-engage tenants who haven't used the platform",
      triggerType: "schedule",
      scheduleType: "inactive_30_days",
      alertType: "info",
      alertTitle: "We miss you!",
      alertMessage: "You haven't created any bookings in 30 days. Need help getting started or have questions? We're here to help!",
      actionUrl: "/dashboard",
      actionLabel: "Get Started",
      cooldownHours: 168, // 7 days
    },
  ];

  const results = [];
  for (const rule of defaultRules) {
    // Check if rule already exists
    const existing = await prisma.alertRule.findFirst({
      where: { name: rule.name },
    });

    if (!existing) {
      const created = await prisma.alertRule.create({ data: rule });
      results.push({ name: rule.name, status: "created", id: created.id });
    } else {
      results.push({ name: rule.name, status: "exists", id: existing.id });
    }
  }

  return results;
}
