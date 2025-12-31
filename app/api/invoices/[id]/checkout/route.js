import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getAuthenticatedTenant } from "@/lib/auth";

/**
 * POST /api/invoices/[id]/checkout
 * Create a Stripe Checkout session for invoice payment
 */
export async function POST(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { paymentOption = "full" } = body; // "full" | "deposit" | "balance"

    // Validate paymentOption
    if (!["full", "deposit", "balance"].includes(paymentOption)) {
      return NextResponse.json(
        { error: "Invalid payment option. Must be 'full', 'deposit', or 'balance'" },
        { status: 400 }
      );
    }

    // Check if Stripe Connect is set up
    if (!tenant.stripeAccountId || tenant.stripeAccountStatus !== "active") {
      return NextResponse.json(
        { error: "Stripe payments are not configured. Please complete Stripe Connect setup." },
        { status: 400 }
      );
    }

    // Fetch the invoice with contact
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        booking: {
          select: { id: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Validate invoice status
    const allowedStatuses = ["sent", "viewed", "overdue"];
    if (!allowedStatuses.includes(invoice.status)) {
      return NextResponse.json(
        { error: `Cannot create payment link for ${invoice.status} invoice. Invoice must be sent first.` },
        { status: 400 }
      );
    }

    // Calculate amount based on payment option
    let amountToCharge = 0;
    let isDeposit = false;
    let description = "";

    const balanceDue = invoice.balanceDue ?? invoice.total;
    const depositAmount = invoice.depositAmount || 0;
    const depositPaid = !!invoice.depositPaidAt;

    if (paymentOption === "deposit") {
      if (!invoice.depositPercent || !depositAmount) {
        return NextResponse.json(
          { error: "This invoice does not have a deposit configured" },
          { status: 400 }
        );
      }
      if (depositPaid) {
        return NextResponse.json(
          { error: "Deposit has already been paid" },
          { status: 400 }
        );
      }
      amountToCharge = depositAmount;
      isDeposit = true;
      description = `Deposit (${invoice.depositPercent}%) for Invoice ${invoice.invoiceNumber}`;
    } else if (paymentOption === "balance") {
      if (balanceDue <= 0) {
        return NextResponse.json(
          { error: "No balance remaining on this invoice" },
          { status: 400 }
        );
      }
      amountToCharge = balanceDue;
      description = `Balance payment for Invoice ${invoice.invoiceNumber}`;
    } else {
      // full payment
      if (invoice.amountPaid > 0) {
        // If already partially paid, charge remaining balance
        amountToCharge = balanceDue;
        description = `Remaining balance for Invoice ${invoice.invoiceNumber}`;
      } else {
        amountToCharge = invoice.total;
        description = `Payment for Invoice ${invoice.invoiceNumber}`;
      }
    }

    if (amountToCharge <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    // Get or create Stripe Customer for the contact
    let stripeCustomerId = invoice.contact?.stripeCustomerId;

    if (!stripeCustomerId && invoice.contact) {
      const customer = await stripe.customers.create(
        {
          email: invoice.contactEmail || invoice.contact.email,
          name: invoice.contactName || invoice.contact.name,
          metadata: {
            contactId: invoice.contact.id,
            tenantId: tenant.id,
          },
        },
        {
          stripeAccount: tenant.stripeAccountId,
        }
      );

      stripeCustomerId = customer.id;

      // Save the Stripe Customer ID to the contact
      await prisma.contact.update({
        where: { id: invoice.contact.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Get the base URL for redirects
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: stripeCustomerId || undefined,
        customer_email: !stripeCustomerId ? (invoice.contactEmail || invoice.contact?.email) : undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description,
              },
              unit_amount: amountToCharge,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            type: "invoice_payment",
            invoiceId: invoice.id,
            tenantId: tenant.id,
            contactId: invoice.contact?.id || "",
            isDeposit: isDeposit.toString(),
            paymentOption,
          },
        },
        metadata: {
          type: "invoice_payment",
          invoiceId: invoice.id,
          tenantId: tenant.id,
          contactId: invoice.contact?.id || "",
          isDeposit: isDeposit.toString(),
          paymentOption,
        },
        success_url: `${origin}/dashboard/invoices/${invoice.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/dashboard/invoices/${invoice.id}?payment=canceled`,
      },
      {
        stripeAccount: tenant.stripeAccountId,
      }
    );

    // Store the checkout session ID on the invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      amountCharged: amountToCharge,
      isDeposit,
      paymentOption,
      invoiceTotal: invoice.total,
      balanceDue: invoice.balanceDue ?? invoice.total,
      remainingAfterPayment: (invoice.balanceDue ?? invoice.total) - amountToCharge,
    });
  } catch (error) {
    console.error("[POST /api/invoices/[id]/checkout] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
