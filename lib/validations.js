import { z } from "zod";

// Client validation schemas
export const createClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(255, "Email is too long"),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
});

export const updateClientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long").optional(),
  email: z.string().email("Invalid email address").max(255, "Email is too long").optional(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
});

// Booking validation schemas
export const createBookingSchema = z.object({
  clientName: z.string().min(2, "Client name must be at least 2 characters").max(100, "Name is too long"),
  clientEmail: z.string().email("Invalid email address").max(255, "Email is too long"),
  clientPhone: z.string().max(20, "Phone number is too long").optional().nullable(),
  serviceId: z.string().uuid("Invalid service ID"),
  date: z.string().datetime("Invalid date format").or(z.date()),
  status: z.enum(["inquiry", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().max(1000, "Notes are too long").optional().nullable(),
  amount: z.number().positive("Amount must be positive").optional().nullable(),
});

export const updateBookingSchema = z.object({
  serviceId: z.string().uuid("Invalid service ID").optional(),
  date: z.string().datetime("Invalid date format").or(z.date()).optional(),
  status: z.enum(["inquiry", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().max(1000, "Notes are too long").optional().nullable(),
  amount: z.number().positive("Amount must be positive").optional().nullable(),
});

// Service validation schemas
export const createServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  duration: z.number().int("Duration must be an integer").positive("Duration must be positive"),
  price: z.number().positive("Price must be positive"),
  active: z.boolean().optional(),
  tenantName: z.string().max(100, "Tenant name is too long").optional(),
  tenantEmail: z.string().email("Invalid email address").max(255, "Email is too long").optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2, "Service name must be at least 2 characters").max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  duration: z.number().int("Duration must be an integer").positive("Duration must be positive").optional(),
  price: z.number().positive("Price must be positive").optional(),
  active: z.boolean().optional(),
});

// Package validation schemas
export const createPackageSchema = z.object({
  name: z.string().min(2, "Package name must be at least 2 characters").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  price: z.number().positive("Price must be positive"),
  serviceIds: z.array(z.string().uuid("Invalid service ID")).min(1, "At least one service is required").optional(),
});

export const updatePackageSchema = z.object({
  name: z.string().min(2, "Package name must be at least 2 characters").max(100, "Name is too long").optional(),
  description: z.string().max(500, "Description is too long").optional().nullable(),
  price: z.number().positive("Price must be positive").optional(),
  serviceIds: z.array(z.string().uuid("Invalid service ID")).optional(),
});

// API Key validation schemas
export const createApiKeySchema = z.object({
  name: z.string().min(2, "API key name must be at least 2 characters").max(100, "Name is too long"),
});

// Invoice validation schemas
const lineItemSchema = z.object({
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"), // Price in cents
  amount: z.number().min(0, "Amount cannot be negative"), // Quantity * unitPrice in cents
});

export const createInvoiceSchema = z.object({
  clientId: z.string().cuid("Invalid client ID").optional().nullable(),
  bookingId: z.string().cuid("Invalid booking ID").optional().nullable(),
  dueDate: z.string().datetime("Invalid date format").or(z.date()),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  clientName: z.string().min(1, "Client name is required").max(100, "Name is too long"),
  clientEmail: z.string().email("Invalid email address").max(255, "Email is too long"),
  clientAddress: z.string().max(500, "Address is too long").optional().nullable(),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  notes: z.string().max(2000, "Notes are too long").optional().nullable(),
  terms: z.string().max(2000, "Terms are too long").optional().nullable(),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
});

export const updateInvoiceSchema = z.object({
  dueDate: z.string().datetime("Invalid date format").or(z.date()).optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required").optional(),
  clientName: z.string().min(1, "Client name is required").max(100, "Name is too long").optional(),
  clientEmail: z.string().email("Invalid email address").max(255, "Email is too long").optional(),
  clientAddress: z.string().max(500, "Address is too long").optional().nullable(),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  notes: z.string().max(2000, "Notes are too long").optional().nullable(),
  terms: z.string().max(2000, "Terms are too long").optional().nullable(),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
});

/**
 * Validate request body against a schema
 * @param {any} data - Data to validate
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @returns {Object} - { success: boolean, data?: any, errors?: string[] }
 */
export function validateRequest(data, schema) {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ["Invalid request data"] };
  }
}
