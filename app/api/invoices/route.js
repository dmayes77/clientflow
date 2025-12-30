import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { createInvoiceSchema, validateRequest } from "@/lib/validations";
import { applyInvoiceStatusTag } from "@/lib/system-tags";

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
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build where clause
    const where = {
      tenantId: tenant.id,
      ...(contactId && { contactId }),
      ...(statusFilter && { status: statusFilter }),
    };

    // Date range filter
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    // Search filter (client name, email, or invoice number)
    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.invoice.count({ where });

    // Fetch invoices with pagination
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        contact: true,
        bookings: {
          include: {
            service: true,
            package: true,
            services: { include: { service: true } },
            packages: { include: { package: true } },
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
      ...(limit > 0 && { take: limit }),
      ...(offset > 0 && { skip: offset }),
    });

    // Calculate stats (from all tenant invoices, not filtered)
    const allInvoicesForStats = await prisma.invoice.findMany({
      where: { tenantId: tenant.id },
      select: { status: true, total: true, balanceDue: true, amountPaid: true },
    });

    const stats = {
      total: allInvoicesForStats.length,
      paid: allInvoicesForStats.filter((i) => i.status === "paid").length,
      pending: allInvoicesForStats.filter((i) => ["sent", "viewed"].includes(i.status)).length,
      overdue: allInvoicesForStats.filter((i) => i.status === "overdue").length,
      totalRevenue: allInvoicesForStats
        .filter((i) => i.status === "paid")
        .reduce((sum, i) => sum + (i.total || 0), 0),
      outstandingAmount: allInvoicesForStats
        .filter((i) => ["sent", "viewed", "overdue"].includes(i.status))
        .reduce((sum, i) => sum + (i.balanceDue || i.total || 0), 0),
      // Status counts for filter pills
      statusCounts: {
        all: allInvoicesForStats.length,
        draft: allInvoicesForStats.filter((i) => i.status === "draft").length,
        sent: allInvoicesForStats.filter((i) => i.status === "sent").length,
        viewed: allInvoicesForStats.filter((i) => i.status === "viewed").length,
        paid: allInvoicesForStats.filter((i) => i.status === "paid").length,
        overdue: allInvoicesForStats.filter((i) => i.status === "overdue").length,
        cancelled: allInvoicesForStats.filter((i) => i.status === "cancelled").length,
      },
    };

    // Flatten tags for easier consumption
    const invoicesWithTags = invoices.map((invoice) => ({
      ...invoice,
      tags: invoice.tags.map((t) => t.tag),
    }));

    return NextResponse.json({
      invoices: invoicesWithTags,
      total,
      stats,
    });
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

    // Verify bookings belong to tenant if provided (supports multiple bookings)
    const bookingIds = data.bookingIds || (data.bookingId ? [data.bookingId] : []);
    if (bookingIds.length > 0) {
      const bookings = await prisma.booking.findMany({
        where: {
          id: { in: bookingIds },
          tenantId: tenant.id,
        },
        include: {
          invoice: true,
        },
      });

      if (bookings.length !== bookingIds.length) {
        return NextResponse.json({ error: "One or more bookings not found" }, { status: 404 });
      }

      // Check if any booking already has an invoice (one invoice per booking)
      const alreadyLinked = bookings.filter(b => b.invoice);
      if (alreadyLinked.length > 0) {
        return NextResponse.json(
          { error: `${alreadyLinked.length} booking(s) already have an invoice` },
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
        bookings: {
          include: {
            service: true,
            package: true,
            services: { include: { service: true } },
            packages: { include: { package: true } },
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
    });

    // Link bookings to the invoice and initialize payment tracking
    if (bookingIds.length > 0) {
      // Fetch bookings to get their totalPrice for balance initialization
      const bookingsToLink = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, tenantId: tenant.id },
        select: { id: true, totalPrice: true },
      });

      // Update each booking with invoiceId and initial balanceDue
      await Promise.all(
        bookingsToLink.map((booking) =>
          prisma.booking.update({
            where: { id: booking.id },
            data: {
              invoiceId: invoice.id,
              bookingBalanceDue: booking.totalPrice, // Initialize balance to full amount
            },
          })
        )
      );
    }

    // Apply status tag
    await applyInvoiceStatusTag(prisma, invoice.id, tenant.id, invoice.status);

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
