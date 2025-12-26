import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createInvoiceSchema, validateRequest } from "@/lib/validations";

// Generate invoice number
async function generateInvoiceNumber(tenantId) {
  const count = await prisma.invoice.count({
    where: { tenantId },
  });
  const paddedNumber = String(count + 1).padStart(5, "0");
  return `INV-${paddedNumber}`;
}

// GET /api/invoices - List all invoices
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get("contactId");
    const statusFilter = searchParams.get("status");

    const where = {
      tenantId: tenant.id,
      ...(contactId && { contactId }),
      ...(statusFilter && { status: statusFilter }),
    };

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contact: true,
        booking: {
          include: {
            service: true,
            package: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten tags for easier consumption
    const invoicesWithTags = invoices.map((invoice) => ({
      ...invoice,
      tags: invoice.tags.map((t) => t.tag),
    }));

    return NextResponse.json(invoicesWithTags);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const body = await request.json();
    const { success, data, errors } = validateRequest(body, createInvoiceSchema);

    if (!success) {
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    // Verify contact belongs to tenant if provided
    if (data.contactId) {
      const contact = await prisma.contact.findFirst({
        where: {
          id: data.contactId,
          tenantId: tenant.id,
        },
      });

      if (!contact) {
        return NextResponse.json({ error: "Contact not found" }, { status: 404 });
      }
    }

    // Verify booking belongs to tenant if provided
    if (data.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: {
          id: data.bookingId,
          tenantId: tenant.id,
        },
        include: {
          invoice: true,
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // Check if booking already has an invoice (one invoice per booking)
      if (booking.invoice) {
        return NextResponse.json(
          { error: "This booking already has an invoice" },
          { status: 400 }
        );
      }
    }

    const invoiceNumber = await generateInvoiceNumber(tenant.id);

    // Safely parse deposit percent - must be positive integer or null
    const safeDepositPercent = (data.depositPercent !== null && data.depositPercent !== undefined && data.depositPercent > 0)
      ? data.depositPercent
      : null;

    // Calculate deposit amount if percent is provided
    const depositAmount = safeDepositPercent
      ? Math.round(data.total * (safeDepositPercent / 100))
      : null;
    const balanceDue = data.total;

    console.log("[POST /api/invoices] Creating invoice with:", JSON.stringify({
      depositPercent: safeDepositPercent,
      depositAmount,
      couponId: data.couponId,
      couponDiscountAmount: data.couponDiscountAmount,
    }));

    const invoice = await prisma.invoice.create({
      data: {
        tenantId: tenant.id,
        contactId: data.contactId,
        bookingId: data.bookingId,
        invoiceNumber,
        status: data.status || "draft",
        dueDate: data.dueDate,
        subtotal: data.subtotal,
        discountCode: data.discountCode || null, // Keep for backwards compatibility
        discountAmount: data.discountAmount || 0, // Keep for backwards compatibility
        taxRate: data.taxRate || 0,
        taxAmount: data.taxAmount || 0,
        total: data.total,
        depositPercent: safeDepositPercent,
        depositAmount,
        amountPaid: 0,
        balanceDue,
        lineItems: data.lineItems,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactAddress: data.contactAddress,
        notes: data.notes,
        terms: data.terms,
      },
      include: {
        contact: true,
        booking: true,
        tags: {
          include: {
            tag: true,
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
      },
    });

    // Track coupon usage if a coupon was applied
    if (data.couponId && data.couponDiscountAmount) {
      // Get the coupon details for snapshot
      const coupon = await prisma.coupon.findUnique({
        where: { id: data.couponId },
      });

      if (coupon) {
        // Create junction record with snapshot
        await prisma.invoiceCoupon.create({
          data: {
            invoiceId: invoice.id,
            couponId: data.couponId,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            calculatedAmount: data.couponDiscountAmount,
          },
        });

        // Increment usage counter
        await prisma.coupon.update({
          where: { id: data.couponId },
          data: { currentUses: { increment: 1 } },
        });
      }
    }

    // Flatten tags
    const invoiceWithTags = {
      ...invoice,
      tags: invoice.tags.map((t) => t.tag),
    };

    console.log("[POST /api/invoices] Created invoice:", JSON.stringify({
      id: invoiceWithTags.id,
      depositPercent: invoiceWithTags.depositPercent,
      depositAmount: invoiceWithTags.depositAmount,
      hasCoupons: invoiceWithTags.coupons?.length > 0,
    }));

    return NextResponse.json(invoiceWithTags, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
