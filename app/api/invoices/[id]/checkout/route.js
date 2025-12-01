import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/invoices/[id]/checkout - Create Stripe Checkout session for invoice payment
export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // Fetch invoice with tenant info
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            name: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if invoice can be paid
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice has already been paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "cancelled") {
      return NextResponse.json(
        { error: "Invoice has been cancelled" },
        { status: 400 }
      );
    }

    if (invoice.status === "draft") {
      return NextResponse.json(
        { error: "Invoice has not been sent yet" },
        { status: 400 }
      );
    }

    // Check if tenant has Stripe Connect set up
    if (!invoice.tenant.stripeAccountId || !invoice.tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Payment processing is not available for this business" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const businessName = invoice.tenant.businessName || invoice.tenant.name || "Business";

    // Create line items for Stripe Checkout
    const lineItems = (invoice.lineItems || []).map((item) => ({
      price_data: {
        currency: invoice.currency,
        product_data: {
          name: item.description,
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    // Add tax as a separate line item if applicable
    if (invoice.taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: invoice.currency,
          product_data: {
            name: `Tax (${invoice.taxRate}%)`,
          },
          unit_amount: invoice.taxAmount,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session on the connected account
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/invoice/${invoice.id}?success=true`,
        cancel_url: `${baseUrl}/invoice/${invoice.id}?canceled=true`,
        customer_email: invoice.clientEmail,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          tenantId: invoice.tenantId,
        },
        payment_intent_data: {
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            tenantId: invoice.tenantId,
          },
        },
      },
      {
        stripeAccount: invoice.tenant.stripeAccountId,
      }
    );

    // Store the checkout session ID on the invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        stripeCheckoutSessionId: session.id,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
