import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { render } from "@react-email/render";
import { FeatureRequestEmail } from "@/emails/admin/feature-request";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dmayes77@gmail.com";
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@getclientflow.app";

// POST /api/feature-request - Submit a feature request
export async function POST(request) {
  try {
    const { email, feature } = await request.json();

    if (!email || !feature) {
      return NextResponse.json(
        { error: "Email and feature description are required" },
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

    // Store the feature request
    const featureRequest = await prisma.featureRequest.create({
      data: {
        email,
        feature,
      },
    });

    // Render the email template
    const emailHtml = await render(
      FeatureRequestEmail({
        email,
        feature,
        requestId: featureRequest.id,
        submittedAt: new Date().toLocaleString(),
      })
    );

    // Send email notification
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject: `New Feature Request from ${email}`,
        html: emailHtml,
        replyTo: email,
      });
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't fail the request if email fails - the request is still saved
    }

    return NextResponse.json({
      success: true,
      message: "Feature request submitted successfully",
      id: featureRequest.id,
    });
  } catch (error) {
    console.error("Error submitting feature request:", error);
    return NextResponse.json(
      { error: "Failed to submit feature request" },
      { status: 500 }
    );
  }
}
