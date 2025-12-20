import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}

// GET /api/admin/tenants/[id] - Get tenant details
export async function GET(request, { params }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
            contacts: true,
            services: true,
            packages: true,
            invoices: true,
            payments: true,
            emailTemplates: true,
            workflows: true,
            webhooks: true,
            images: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get usage stats
    const [
      bookingsThisMonth,
      paymentsTotal,
      recentBookings,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          tenantId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.payment.aggregate({
        where: { tenantId: id, status: "succeeded" },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.booking.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          totalPrice: true,
          createdAt: true,
          contact: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      tenant,
      usage: {
        bookingsThisMonth,
        totalRevenue: paymentsTotal._sum.amount || 0,
        totalPayments: paymentsTotal._count,
      },
      recentBookings,
    });
  } catch (error) {
    console.error("Error fetching tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/tenants/[id] - Update tenant
export async function PATCH(request, { params }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = [
      "subscriptionStatus",
      "currentPeriodEnd",
      "planType",
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "currentPeriodEnd" && body[field]) {
          updateData[field] = new Date(body[field]);
        } else {
          updateData[field] = body[field];
        }
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error("Error updating tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/tenants/[id] - Delete tenant (careful!)
export async function DELETE(request, { params }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // For safety, we'll just mark as deleted rather than actually deleting
    // You could add a "deletedAt" field to the schema for soft deletes
    // For now, we'll update subscription status to "canceled"
    const tenant = await prisma.tenant.update({
      where: { id },
      data: {
        subscriptionStatus: "canceled",
      },
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error("Error deleting tenant:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
