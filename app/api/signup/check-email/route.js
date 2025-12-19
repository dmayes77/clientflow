import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

// POST /api/signup/check-email - Check if email is already in use
export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        available: false,
        error: "Invalid email format"
      }, { status: 400 });
    }

    // Check if email exists in Clerk
    const client = await clerkClient();
    const users = await client.users.getUserList({
      emailAddress: [email],
    });

    const isAvailable = users.data.length === 0;

    return NextResponse.json({
      available: isAvailable,
      message: isAvailable ? "Email is available" : "Email is already registered"
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json({
      error: "Failed to check email availability"
    }, { status: 500 });
  }
}
