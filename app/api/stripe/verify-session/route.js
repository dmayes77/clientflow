import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

// GET /api/stripe/verify-session - Verify a Stripe checkout session
export async function GET(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check session status
    if (session.payment_status === "paid" || session.status === "complete") {
      return NextResponse.json({
        success: true,
        status: session.status,
        paymentStatus: session.payment_status,
        customerId: session.customer,
        subscriptionId: session.subscription,
      });
    }

    // Session exists but payment not complete
    return NextResponse.json({
      success: false,
      status: session.status,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}
