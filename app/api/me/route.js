import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// GET /api/me - Get current user ID (for admin setup)
export async function GET() {
  try {
    const { userId, orgId } = await auth();

    return NextResponse.json({
      userId,
      orgId,
      message: "Add this userId to ADMIN_USER_IDS in your environment variables",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
