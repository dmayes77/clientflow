import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { applyBalancePaymentToBooking } from "@/lib/payment-allocation";

// GET /api/bookings/[id]/pay-balance - Get balance payment info for a booking
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            total: true,
            amountPaid: true,
            balanceDue: true,
            status: true,
          },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true, price: true },
            },
          },
        },
        packages: {
          include: {
            package: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Calculate balance due
    const balanceDue = booking.bookingBalanceDue ?? (booking.totalPrice - (booking.bookingAmountPaid || 0));

    return NextResponse.json({
      bookingId: booking.id,
      contactId: booking.contactId,
      invoiceId: booking.invoiceId,
      totalPrice: booking.totalPrice,
      depositAllocated: booking.depositAllocated || 0,
      amountPaid: booking.bookingAmountPaid || 0,
      balanceDue,
      paymentStatus: booking.paymentStatus,
      contact: {
        id: booking.contact?.id,
        name: booking.contact?.name,
        email: booking.contact?.email,
      },
      services: booking.services.map((bs) => ({
        name: bs.service?.name,
        price: bs.service?.price,
        quantity: bs.quantity,
      })),
      packages: booking.packages.map((bp) => ({
        name: bp.package?.name,
        price: bp.package?.price,
        quantity: bp.quantity,
      })),
    });
  } catch (error) {
    console.error("Error fetching booking balance info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/bookings/[id]/pay-balance - Record a balance payment for a booking
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, paymentId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        invoice: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Calculate new payment state
    const updateData = applyBalancePaymentToBooking(booking, amount);

    // Update the booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...updateData,
        paymentId: paymentId || booking.paymentId,
      },
    });

    // If linked to an invoice, update the invoice's amountPaid and balanceDue
    if (booking.invoiceId && booking.invoice) {
      const newInvoiceAmountPaid = (booking.invoice.amountPaid || 0) + amount;
      const newInvoiceBalanceDue = booking.invoice.total - newInvoiceAmountPaid;

      await prisma.invoice.update({
        where: { id: booking.invoiceId },
        data: {
          amountPaid: newInvoiceAmountPaid,
          balanceDue: newInvoiceBalanceDue,
          // Mark as paid if fully paid
          status: newInvoiceBalanceDue <= 0 ? "paid" : booking.invoice.status,
          paidAt: newInvoiceBalanceDue <= 0 ? new Date() : booking.invoice.paidAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        paymentStatus: updatedBooking.paymentStatus,
        amountPaid: updatedBooking.bookingAmountPaid,
        balanceDue: updatedBooking.bookingBalanceDue,
      },
    });
  } catch (error) {
    console.error("Error recording booking balance payment:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
