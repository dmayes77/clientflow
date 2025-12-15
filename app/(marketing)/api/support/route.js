import { NextResponse } from "next/server";
import { resend } from "@/lib/resend";
import { supportRequestEmail } from "@/lib/emails/support-request";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dmayes77@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@getclientflow.com";

// POST /api/support - Submit a support request
export async function POST(request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Generate email HTML
    const emailHtml = supportRequestEmail({
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toLocaleString(),
    });

    // Send email notification
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `[Support] ${subject}`,
        html: emailHtml,
        replyTo: email,
      });
    } catch (emailError) {
      console.error("Failed to send support email:", emailError);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Support request submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting support request:", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}
