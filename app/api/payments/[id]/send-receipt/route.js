import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { sendPaymentConfirmation } from "@/lib/send-system-email";

// POST /api/payments/[id]/send-receipt - Send payment receipt email
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    const { id } = await params;

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Get the payment with contact and tenant relations
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        tenant: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (!payment.contact?.email) {
      return NextResponse.json(
        { error: "No email address for this contact" },
        { status: 400 }
      );
    }

    // Send the payment confirmation email
    const result = await sendPaymentConfirmation(payment);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send receipt" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Receipt sent to ${payment.contact.email}`,
    });
  } catch (error) {
    console.error("Error sending payment receipt:", error);
    return NextResponse.json(
      { error: "Failed to send receipt" },
      { status: 500 }
    );
  }
}
