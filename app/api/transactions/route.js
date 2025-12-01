import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET /api/transactions - List all payments for the tenant
export async function GET(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Build where clause
    const where = {
      tenantId: tenant.id,
    };

    if (status && status !== "all") {
      where.status = status;
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate),
      };
    }

    // Fetch payments with pagination
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          bookings: {
            select: {
              id: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    // Calculate summary stats
    const stats = await prisma.payment.groupBy({
      by: ["status"],
      where: { tenantId: tenant.id },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const summary = {
      totalRevenue: 0,
      pendingAmount: 0,
      refundedAmount: 0,
      transactionCount: 0,
    };

    stats.forEach((stat) => {
      summary.transactionCount += stat._count;
      if (stat.status === "succeeded") {
        summary.totalRevenue += stat._sum.amount || 0;
      } else if (stat.status === "pending") {
        summary.pendingAmount += stat._sum.amount || 0;
      } else if (stat.status === "refunded") {
        summary.refundedAmount += stat._sum.amount || 0;
      }
    });

    return NextResponse.json({
      payments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + payments.length < totalCount,
      },
      summary,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
