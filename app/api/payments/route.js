import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/payments - List all payments for tenant
export async function GET(request) {
  try {
    const { orgId } = await auth();

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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where = {
      tenantId: tenant.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
        { stripePaymentIntentId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    // Get payments with relations
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true, email: true },
          },
          bookings: {
            select: {
              id: true,
              scheduledAt: true,
              service: { select: { name: true } },
              package: { select: { name: true } },
            },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate summary stats
    const stats = await prisma.payment.aggregate({
      where: { tenantId: tenant.id, status: "succeeded" },
      _sum: { amount: true },
      _count: true,
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        stripePaymentIntentId: p.stripePaymentIntentId,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        depositAmount: p.depositAmount,
        serviceTotal: p.serviceTotal,
        refundedAmount: p.refundedAmount,
        disputeStatus: p.disputeStatus,
        cardBrand: p.cardBrand,
        cardLast4: p.cardLast4,
        clientName: p.clientName,
        clientEmail: p.clientEmail,
        createdAt: p.createdAt,
        capturedAt: p.capturedAt,
        contact: p.contact,
        booking: p.bookings?.[0]
          ? {
              id: p.bookings[0].id,
              scheduledAt: p.bookings[0].scheduledAt,
              serviceName: p.bookings[0].service?.name || p.bookings[0].package?.name || "Service",
            }
          : null,
      })),
      total,
      stats: {
        totalRevenue: stats._sum.amount || 0,
        paymentCount: stats._count,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
