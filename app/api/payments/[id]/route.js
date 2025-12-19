import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments/[id] - Get payment details
export async function GET(request, { params }) {
  try {
    const { orgId } = await auth();
    const { id } = await params;

    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: {
          select: { id: true, name: true, email: true, phone: true },
        },
        bookings: {
          select: {
            id: true,
            scheduledAt: true,
            duration: true,
            totalPrice: true,
            status: true,
            paymentStatus: true,
            notes: true,
            service: { select: { id: true, name: true, price: true } },
            package: { select: { id: true, name: true, price: true } },
            services: {
              include: { service: { select: { id: true, name: true, price: true } } },
            },
            packages: {
              include: { package: { select: { id: true, name: true, price: true } } },
            },
          },
          take: 1,
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get first booking (Payment has many-to-many with Booking)
    const booking = payment.bookings?.[0] || null;

    // Build service details
    let serviceDetails = [];
    if (booking) {
      if (booking.services?.length > 0) {
        serviceDetails = booking.services.map((bs) => ({
          name: bs.service.name,
          price: bs.service.price,
        }));
      } else if (booking.service) {
        serviceDetails.push({
          name: booking.service.name,
          price: booking.service.price,
        });
      }
      if (booking.packages?.length > 0) {
        serviceDetails.push(
          ...booking.packages.map((bp) => ({
            name: bp.package.name,
            price: bp.package.price,
            isPackage: true,
          }))
        );
      } else if (booking.package) {
        serviceDetails.push({
          name: booking.package.name,
          price: booking.package.price,
          isPackage: true,
        });
      }
    }

    // Parse metadata
    let metadata = {};
    try {
      metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    } catch (e) {
      // Ignore parse errors
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        stripeChargeId: payment.stripeChargeId,
        stripeAccountId: payment.stripeAccountId,
        stripeReceiptUrl: payment.stripeReceiptUrl,
        amount: payment.amount,
        currency: payment.currency,
        depositAmount: payment.depositAmount,
        serviceTotal: payment.serviceTotal,
        refundedAmount: payment.refundedAmount,
        status: payment.status,
        disputeStatus: payment.disputeStatus,
        cardBrand: payment.cardBrand,
        cardLast4: payment.cardLast4,
        clientName: payment.clientName,
        clientEmail: payment.clientEmail,
        createdAt: payment.createdAt,
        capturedAt: payment.capturedAt,
        metadata,
        contact: payment.contact,
        booking: booking
          ? {
              id: booking.id,
              scheduledAt: booking.scheduledAt,
              duration: booking.duration,
              totalPrice: booking.totalPrice,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              notes: booking.notes,
            }
          : null,
        serviceDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
