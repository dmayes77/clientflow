import { z } from "zod";

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactStatusEnum = z.enum(["lead", "client", "active", "inactive", "unclassified"]);

export const createContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20, "Phone must be less than 20 characters").optional().nullable(),
  company: z.string().max(100, "Company must be less than 100 characters").optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  status: contactStatusEnum.optional().nullable(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

// ============================================
// SERVICE SCHEMAS
// ============================================

export const createServiceSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  duration: z.number().int().positive("Duration must be a positive number"),
  price: z.number().int().min(0, "Price must be 0 or greater"),
  active: z.boolean().optional().default(true),
  categoryId: z.string().cuid().optional().nullable(),
  newCategoryName: z.string().min(1).max(50).optional(), // For creating a new category inline
  includes: z.array(z.string().max(200)).max(20).optional().default([]), // What's included in the service
  imageId: z.string().cuid().optional().nullable(), // Featured image from media library
});

export const updateServiceSchema = createServiceSchema.partial();

// ============================================
// PACKAGE SCHEMAS
// ============================================

export const discountPercentEnum = z.enum(["5", "10", "15", "20"]).transform(Number);

export const createPackageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional().nullable(),
  discountPercent: z.number().int().refine((val) => [5, 10, 15, 20].includes(val), {
    message: "Discount must be 5, 10, 15, or 20 percent",
  }).default(15),
  active: z.boolean().optional().default(true),
  serviceIds: z.array(z.string().cuid()).min(1, "At least one service is required"),
  categoryId: z.string().cuid().optional().nullable(),
  newCategoryName: z.string().min(1).max(50).optional(), // For creating a new category inline
  overridePrice: z.number().int().min(0, "Price must be 0 or greater").optional().nullable(), // Custom price override
});

export const updatePackageSchema = createPackageSchema.partial().extend({
  serviceIds: z.array(z.string().cuid()).min(1, "At least one service is required").optional(),
});

// ============================================
// BOOKING SCHEMAS
// ============================================

export const bookingStatusEnum = z.enum(["inquiry", "scheduled", "confirmed", "completed", "cancelled"]);

export const createBookingSchema = z.object({
  contactId: z.string().cuid("Invalid contact ID"),
  serviceId: z.string().cuid("Invalid service ID").optional().nullable(),
  packageId: z.string().cuid("Invalid package ID").optional().nullable(),
  scheduledAt: z.coerce.date(),
  status: bookingStatusEnum.optional().default("inquiry"),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().nullable(),
  totalPrice: z.number().int().min(0, "Price must be 0 or greater"),
  duration: z.number().int().positive("Duration must be a positive number"),
});

export const updateBookingSchema = createBookingSchema.partial();

// ============================================
// API KEY SCHEMAS
// ============================================

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
});

// ============================================
// AVAILABILITY SCHEMAS
// ============================================

export const createAvailabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  active: z.boolean().optional().default(true),
});

export const updateAvailabilitySchema = createAvailabilitySchema.partial();

// ============================================
// AVAILABILITY OVERRIDE SCHEMAS
// ============================================

export const overrideTypeEnum = z.enum(["blocked", "custom"]);

export const createAvailabilityOverrideSchema = z.object({
  date: z.coerce.date(),
  type: overrideTypeEnum,
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional().nullable(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format").optional().nullable(),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional().nullable(),
});

// ============================================
// WEBHOOK SCHEMAS
// ============================================

export const webhookEventEnum = z.enum([
  "booking.created",
  "booking.updated",
  "booking.cancelled",
  "booking.completed",
  "contact.created",
  "contact.updated",
  "payment.received",
  "invoice.created",
  "invoice.paid",
]);

export const createWebhookSchema = z.object({
  url: z.string().url("Invalid URL"),
  events: z.array(webhookEventEnum).min(1, "At least one event is required"),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateWebhookSchema = createWebhookSchema.partial();

// ============================================
// INVOICE SCHEMAS
// ============================================

export const invoiceStatusEnum = z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]);

export const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  unitPrice: z.number().int().min(0, "Unit price must be 0 or greater"),
  amount: z.number().int(),
  serviceId: z.string().cuid().optional().nullable(),
  packageId: z.string().cuid().optional().nullable(),
  isDiscount: z.boolean().optional().default(false),
});

export const createInvoiceSchema = z.object({
  contactId: z.string().cuid("Invalid contact ID"),
  bookingId: z.string().cuid("Invalid booking ID").optional().nullable(),
  dueDate: z.coerce.date(),
  status: invoiceStatusEnum.optional().default("draft"),
  subtotal: z.number().int().min(0, "Subtotal must be 0 or greater"),
  discountCode: z.string().max(50, "Discount code must be less than 50 characters").optional().nullable(),
  discountAmount: z.number().int().min(0, "Discount amount must be 0 or greater").optional().default(0),
  taxRate: z.number().min(0, "Tax rate must be 0 or greater").max(100, "Tax rate must be 100 or less").optional().default(0),
  taxAmount: z.number().int().min(0, "Tax amount must be 0 or greater").optional().default(0),
  total: z.number().int().min(0, "Total must be 0 or greater"),
  depositPercent: z.number().int().min(0).max(100).optional().nullable(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  contactName: z.string().min(1, "Contact name is required").max(100),
  contactEmail: z.string().email("Invalid email address"),
  contactAddress: z.string().max(500, "Address must be less than 500 characters").optional().nullable(),
  notes: z.string().max(2000, "Notes must be less than 2000 characters").optional().nullable(),
  terms: z.string().max(2000, "Terms must be less than 2000 characters").optional().nullable(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// ============================================
// COUPON SCHEMAS
// ============================================

export const discountTypeEnum = z.enum(["percentage", "fixed"]);

export const createCouponSchema = z.object({
  code: z.string()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code must be less than 20 characters")
    .regex(/^[A-Z0-9-_]+$/, "Code can only contain uppercase letters, numbers, hyphens, and underscores")
    .transform(str => str.toUpperCase()),
  description: z.string().max(500, "Description must be less than 500 characters").optional().nullable(),
  discountType: discountTypeEnum,
  discountValue: z.number().int().min(0, "Discount value must be 0 or greater")
    .refine((val, ctx) => {
      const parent = ctx?.parent;
      if (parent?.discountType === "percentage" && val > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage must be between 0 and 100",
        });
        return false;
      }
      return true;
    }),
  applicableServiceIds: z.array(z.string().cuid()).optional().default([]),
  applicablePackageIds: z.array(z.string().cuid()).optional().default([]),
  minPurchaseAmount: z.number().int().positive("Minimum purchase must be a positive number").optional().nullable(),
  maxDiscountAmount: z.number().int().positive("Maximum discount must be a positive number").optional().nullable(),
  maxUses: z.number().int().positive("Max uses must be a positive number").optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const updateCouponSchema = createCouponSchema.partial();

// ============================================
// TENANT/BUSINESS SCHEMAS
// ============================================

export const updateTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  slug: z.string().min(3, "Slug must be at least 3 characters").max(50).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens").optional(),
  businessName: z.string().max(100).optional().nullable(),
  businessAddress: z.string().max(200).optional().nullable(),
  businessCity: z.string().max(100).optional().nullable(),
  businessState: z.string().max(100).optional().nullable(),
  businessZip: z.string().max(20).optional().nullable(),
  businessCountry: z.string().max(100).optional().nullable(),
  businessPhone: z.string().max(20).optional().nullable(),
  contactPerson: z.string().max(100).optional().nullable(),
  businessWebsite: z.string().url().optional().nullable().or(z.literal("")),
  businessDescription: z.string().max(2000).optional().nullable(),
  timezone: z.string().optional(),
  slotInterval: z.number().int().min(5).max(120).optional(),
  breakDuration: z.number().int().min(0).max(180).optional(), // 0-3 hours break
  defaultCalendarView: z.enum(["month", "week", "day"]).optional(),
  defaultTaxRate: z.number().min(0).max(100).optional(), // 0-100% tax rate
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  facebookUrl: z.string().url().optional().nullable().or(z.literal("")),
  twitterUrl: z.string().url().optional().nullable().or(z.literal("")),
  instagramUrl: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  youtubeUrl: z.string().url().optional().nullable().or(z.literal("")),
});

// ============================================
// FEATURE REQUEST SCHEMA (public)
// ============================================

export const createFeatureRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  feature: z.string().min(10, "Feature description must be at least 10 characters").max(2000, "Feature description must be less than 2000 characters"),
});

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Validate request data against a Zod schema
 * @param {any} data - The data to validate
 * @param {z.ZodSchema} schema - The Zod schema to validate against
 * @returns {{ success: boolean, data?: any, errors?: string[] }}
 */
export function validateRequest(data, schema) {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ["Validation failed"] };
  }
}
