import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Simple admin authentication with passcode
export async function POST(request) {
  try {
    const { passcode } = await request.json();
    const adminPasscode = process.env.ADMIN_PASSCODE;

    if (!adminPasscode) {
      return NextResponse.json(
        { error: "Admin authentication not configured" },
        { status: 500 }
      );
    }

    if (passcode !== adminPasscode) {
      return NextResponse.json(
        { error: "Invalid passcode" },
        { status: 401 }
      );
    }

    // Set secure HTTP-only cookie for admin session
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

// Logout endpoint
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return NextResponse.json({ success: true });
}

// Check if admin is authenticated
export async function GET() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");

  return NextResponse.json({
    authenticated: adminSession?.value === "authenticated",
  });
}
