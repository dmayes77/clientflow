"use client";

import { useMemo } from "react";
import { format } from "date-fns";

/**
 * Safe lineItems parser - handles JSON string or array
 */
export function parseLineItems(lineItems) {
  if (!lineItems) return [];
  if (Array.isArray(lineItems)) return lineItems;
  if (typeof lineItems === "string") {
    try {
      const parsed = JSON.parse(lineItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Safe deposit percent parser
 */
export function parseDepositPercent(value) {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseInt(value, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Calculate deposit amount from invoice data
 */
export function calculateDepositAmount(invoice) {
  if (!invoice) return 0;
  const depositAmount = invoice.depositAmount;
  if (depositAmount !== null && depositAmount !== undefined) {
    const parsed = typeof depositAmount === "number" ? depositAmount : parseFloat(depositAmount);
    return !isNaN(parsed) && isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  const percent = parseDepositPercent(invoice.depositPercent);
  const total = typeof invoice.total === "number" && !isNaN(invoice.total) ? invoice.total : 0;
  return Math.round(total * (percent / 100));
}

/**
 * Format currency amount (from cents to display string)
 */
export function formatInvoiceCurrency(amountInCents, currency = "usd") {
  const amount = (amountInCents || 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format currency from dollars (not cents)
 */
export function formatDollars(amount, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount || 0);
}

/**
 * Calculate invoice totals from form values (amounts in dollars)
 */
export function calculateFormTotals(lineItems = [], taxRate = 0, couponDiscount = 0) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  const regularItems = items.filter((item) => !item.isDiscount);
  const discountItems = items.filter((item) => item.isDiscount);

  const subtotal = regularItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  const lineDiscounts = discountItems.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + Math.abs(isNaN(amount) ? 0 : amount);
  }, 0);

  const discountedSubtotal = subtotal - lineDiscounts - couponDiscount;
  const safeTaxRate = parseFloat(taxRate) || 0;
  const taxAmount = discountedSubtotal * (safeTaxRate / 100);
  const total = discountedSubtotal + taxAmount;

  return {
    subtotal: isNaN(subtotal) ? 0 : subtotal,
    lineDiscounts: isNaN(lineDiscounts) ? 0 : lineDiscounts,
    couponDiscount: isNaN(couponDiscount) ? 0 : couponDiscount,
    discountedSubtotal: isNaN(discountedSubtotal) ? 0 : discountedSubtotal,
    taxRate: safeTaxRate,
    taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
    total: isNaN(total) ? 0 : total,
  };
}

/**
 * Normalize invoice data for display (handles both API response and form state)
 * @param {Object} invoice - Invoice data (from API or form)
 * @param {Object} options - Additional options
 * @param {Object} options.tenant - Tenant/business info
 * @param {boolean} options.fromForm - If true, amounts are in dollars; if false, in cents
 * @param {Object} options.coupon - Applied coupon info { code, discountAmount }
 * @returns {Object} Normalized invoice data for rendering
 */
export function normalizeInvoiceData(invoice, options = {}) {
  const { tenant = {}, fromForm = false, coupon = null } = options;

  if (!invoice) {
    return null;
  }

  // Parse line items
  const rawLineItems = parseLineItems(invoice.lineItems);

  // Normalize line items (convert cents to dollars if from API)
  const lineItems = rawLineItems.map((item) => {
    const quantity = parseInt(item.quantity) || 1;
    const unitPrice = fromForm ? parseFloat(item.unitPrice) || 0 : (parseFloat(item.unitPrice) || 0) / 100;
    const amount = fromForm ? parseFloat(item.amount) || 0 : (parseFloat(item.amount) || 0) / 100;

    return {
      description: item.description || "",
      quantity,
      unitPrice,
      amount,
      serviceId: item.serviceId || null,
      packageId: item.packageId || null,
      isDiscount: item.isDiscount || false,
    };
  });

  // Calculate totals (in dollars)
  const couponDiscountDollars = coupon?.discountAmount
    ? (fromForm ? coupon.discountAmount / 100 : coupon.discountAmount / 100)
    : 0;

  const totals = calculateFormTotals(
    lineItems,
    invoice.taxRate || 0,
    couponDiscountDollars
  );

  // For API data, use stored values; for form data, use calculated
  const subtotal = fromForm ? totals.subtotal : (invoice.subtotal || 0) / 100;
  const taxAmount = fromForm ? totals.taxAmount : (invoice.taxAmount || 0) / 100;
  const total = fromForm ? totals.total : (invoice.total || 0) / 100;
  const discountAmount = fromForm ? totals.lineDiscounts : (invoice.discountAmount || 0) / 100;

  // Deposit calculations
  const depositPercent = parseDepositPercent(invoice.depositPercent);
  const depositAmountCents = calculateDepositAmount(invoice);
  const depositAmount = fromForm
    ? (depositPercent > 0 ? total * (depositPercent / 100) : 0)
    : depositAmountCents / 100;

  // Balance calculations
  const amountPaid = fromForm ? 0 : (invoice.amountPaid || 0) / 100;
  const balanceDue = fromForm ? total : (invoice.balanceDue || invoice.total || 0) / 100;

  // Format dates
  const formatDate = (date) => {
    if (!date) return null;
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return null;
    }
  };

  const formatDateFull = (date) => {
    if (!date) return null;
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch {
      return null;
    }
  };

  // Build business address
  const businessAddress = [
    tenant.businessAddress,
    tenant.businessCity,
    tenant.businessState,
    tenant.businessZip,
    tenant.businessCountry,
  ]
    .filter(Boolean)
    .join(", ");

  // Coupons from invoice
  const coupons = invoice.coupons?.map((ic) => ({
    id: ic.id,
    code: ic.coupon?.code || coupon?.code || "Applied",
    discountAmount: (ic.calculatedAmount || 0) / 100,
  })) || [];

  // Add current coupon if not from API
  if (coupon && !coupons.length) {
    coupons.push({
      id: "pending",
      code: coupon.code,
      discountAmount: couponDiscountDollars,
    });
  }

  return {
    // Identity
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber || "INV-DRAFT",
    status: invoice.status || "draft",

    // Contact info
    contactName: invoice.contactName || "",
    contactEmail: invoice.contactEmail || "",
    contactAddress: invoice.contactAddress || "",

    // Business info
    businessName: tenant.businessName || "",
    businessEmail: tenant.email || tenant.businessEmail || "",
    businessPhone: tenant.businessPhone || "",
    businessAddress,
    logoUrl: tenant.logoUrl || null,

    // Dates
    issueDate: formatDate(invoice.issueDate || invoice.createdAt || new Date()),
    issueDateFull: formatDateFull(invoice.issueDate || invoice.createdAt || new Date()),
    dueDate: formatDate(invoice.dueDate),
    dueDateFull: formatDateFull(invoice.dueDate),
    sentAt: formatDate(invoice.sentAt),
    paidAt: formatDate(invoice.paidAt),
    depositPaidAt: formatDate(invoice.depositPaidAt),

    // Line items
    lineItems,
    regularItems: lineItems.filter((item) => !item.isDiscount),
    discountItems: lineItems.filter((item) => item.isDiscount),

    // Financials (in dollars)
    subtotal,
    lineDiscounts: totals.lineDiscounts,
    discountCode: invoice.discountCode || null,
    discountAmount,
    coupons,
    couponTotal: coupons.reduce((sum, c) => sum + c.discountAmount, 0),
    taxRate: invoice.taxRate || 0,
    taxAmount,
    total,

    // Deposit
    depositPercent,
    depositAmount,
    depositPaid: !!invoice.depositPaidAt,

    // Payment
    amountPaid,
    balanceDue: invoice.status === "paid" ? 0 : balanceDue - amountPaid,

    // Notes & Terms
    notes: invoice.notes || "",
    terms: invoice.terms || "",

    // Related data
    booking: invoice.booking || null,
    contact: invoice.contact || null,
    tags: invoice.tags || [],

    // Raw data for reference
    _raw: invoice,
    _currency: invoice.currency || "usd",
  };
}

/**
 * Hook to normalize and memoize invoice data
 * @param {Object} invoice - Invoice data
 * @param {Object} options - Options passed to normalizeInvoiceData
 * @returns {Object} Normalized invoice data
 */
export function useInvoiceData(invoice, options = {}) {
  return useMemo(
    () => normalizeInvoiceData(invoice, options),
    [invoice, options.tenant, options.fromForm, options.coupon]
  );
}

/**
 * Get status display info
 */
export function getStatusInfo(status) {
  const statusMap = {
    draft: { label: "Draft", color: "gray", bgClass: "bg-gray-100 text-gray-800" },
    sent: { label: "Sent", color: "blue", bgClass: "bg-blue-100 text-blue-800" },
    viewed: { label: "Viewed", color: "purple", bgClass: "bg-purple-100 text-purple-800" },
    paid: { label: "Paid", color: "green", bgClass: "bg-green-100 text-green-800" },
    overdue: { label: "Overdue", color: "red", bgClass: "bg-red-100 text-red-800" },
    cancelled: { label: "Cancelled", color: "gray", bgClass: "bg-gray-100 text-gray-600" },
  };
  return statusMap[status] || statusMap.draft;
}
