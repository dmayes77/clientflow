import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedTenant } from "@/lib/auth";
import { sendTemplatedEmail } from "@/lib/email";

const prisma = new PrismaClient();

const testEmailSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  sampleData: z.record(z.record(z.any())).optional().default({}),
});

/**
 * Send a test email using a template
 * POST /api/email-templates/[id]/test
 */
export async function POST(request, { params }) {
  try {
    // Authenticate
    const tenant = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate request body
    const body = await request.json();
    const validation = testEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { recipientEmail, sampleData } = validation.data;

    // Fetch the template
    const template = await prisma.emailTemplate.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Provide default sample data if not provided
    const defaultSampleData = {
      contact: {
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        email: recipientEmail,
      },
      business: {
        name: tenant.businessName || "Your Business",
        email: tenant.businessEmail || "hello@yourbusiness.com",
        phone: "(555) 123-4567",
        address: "123 Main St, City, ST 12345",
      },
      invoice: {
        number: "INV-001",
        amount: "$1,234.56",
        balanceDue: "$1,234.56",
        dueDate: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        paymentUrl: "https://example.com/pay/invoice-001",
      },
      booking: {
        service: "Premium Consultation",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }
        ),
        time: "2:00 PM",
        duration: "60 minutes",
        price: "$150.00",
        confirmationNumber: "BK-12345",
        rescheduleUrl: "https://example.com/bookings/BK-12345/reschedule",
        cancelUrl: "https://example.com/bookings/BK-12345/cancel",
      },
      payment: {
        amount: "$1,234.56",
        date: new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        method: "Credit Card (****1234)",
        confirmationNumber: "PMT-67890",
        receiptUrl: "https://example.com/receipts/PMT-67890",
      },
    };

    // Merge provided sample data with defaults
    const mergedData = {
      ...defaultSampleData,
      ...sampleData,
    };

    // Send the test email
    const result = await sendTemplatedEmail({
      to: recipientEmail,
      subject: `[TEST] ${template.subject}`,
      body: template.body,
      variables: mergedData,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to send test email",
          details: result.error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${recipientEmail}`,
      emailId: result.id,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    );
  }
}
