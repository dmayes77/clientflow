import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];
const IMPERSONATION_COOKIE = "cf_impersonate";

async function isAdmin() {
  const { userId } = await auth();
  if (!userId) return { isAdmin: false, userId: null };
  return { isAdmin: ADMIN_USER_IDS.includes(userId), userId };
}

// POST - Start impersonation
export async function POST(request) {
  try {
    const { isAdmin: admin, userId } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID required" }, { status: 400 });
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, businessName: true, clerkOrgId: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Set impersonation cookie
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATION_COOKIE, JSON.stringify({
      tenantId: tenant.id,
      tenantName: tenant.businessName || tenant.name,
      clerkOrgId: tenant.clerkOrgId,
      adminUserId: userId,
      startedAt: new Date().toISOString(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 2, // 2 hours
      path: "/",
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.businessName || tenant.name,
      },
    });
  } catch (error) {
    console.error("Error starting impersonation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - End impersonation
export async function DELETE() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.delete(IMPERSONATION_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending impersonation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Check impersonation status
export async function GET() {
  try {
    const { isAdmin: admin } = await isAdmin();
    if (!admin) {
      return NextResponse.json({ impersonating: false });
    }

    const cookieStore = await cookies();
    const impersonationCookie = cookieStore.get(IMPERSONATION_COOKIE);

    if (!impersonationCookie) {
      return NextResponse.json({ impersonating: false });
    }

    try {
      const data = JSON.parse(impersonationCookie.value);
      return NextResponse.json({
        impersonating: true,
        ...data,
      });
    } catch {
      return NextResponse.json({ impersonating: false });
    }
  } catch (error) {
    console.error("Error checking impersonation:", error);
    return NextResponse.json({ impersonating: false });
  }
}
