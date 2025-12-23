import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET /api/admin/tenants - List all tenants with pagination and search
export async function GET(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // subscription status filter
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { businessName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.subscriptionStatus = status;
    }

    // Build orderBy
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get tenants with counts
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          clerkOrgId: true,
          name: true,
          businessName: true,
          email: true,
          slug: true,
          subscriptionStatus: true,
          stripeSubscriptionId: true,
          currentPeriodEnd: true,
          stripeCustomerId: true,
          stripeAccountId: true,
          stripeAccountStatus: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              contacts: true,
              services: true,
              invoices: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    return NextResponse.json({
      tenants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tenants:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
