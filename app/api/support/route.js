import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * POST /api/support
 * Create a new support message
 * Can be called from marketing site (unauthenticated) or tenant dashboard (authenticated)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, type = "support", metadata } = body;

    // Validation
    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      );
    }

    // Check if request is from authenticated tenant
    const { orgId } = await auth();
    let tenantId = null;

    if (orgId) {
      // User is authenticated - find their tenant
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { id: true },
      });
      tenantId = tenant?.id || null;
    } else {
      // Unauthenticated - require email and name
      if (!email || !name) {
        return NextResponse.json(
          { error: "Email and name are required for unauthenticated requests" },
          { status: 400 }
        );
      }
    }

    // Create support message
    const supportMessage = await prisma.supportMessage.create({
      data: {
        type,
        subject,
        message,
        name,
        email,
        tenantId,
        metadata,
        status: "unread",
        priority: type === "bug" || type === "error" ? "high" : "normal",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Support message received. We'll get back to you soon!",
      id: supportMessage.id,
    });
  } catch (error) {
    console.error("Error creating support message:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support
 * Get all support messages (admin only)
 * Query params: status, type, limit, offset
 */
export async function GET(request) {
  try {
    // For now, require admin access (you can add admin check here)
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where = {};
    if (status && status !== "all") where.status = status;
    if (type && type !== "all") where.type = type;

    // Get messages with count
    const [messages, totalCount, unreadCount] = await Promise.all([
      prisma.supportMessage.findMany({
        where,
        include: {
          tenant: {
            select: {
              id: true,
              businessName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.supportMessage.count({ where }),
      prisma.supportMessage.count({ where: { status: "unread" } }),
    ]);

    return NextResponse.json({
      messages,
      totalCount,
      unreadCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching support messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
