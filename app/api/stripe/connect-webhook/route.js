import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { triggerWebhook } from "@/lib/webhooks";
import { sendInvoicePaidReceipt } from "@/lib/email";

// This webhook handles events from Connected Accounts (Stripe Connect)
// It receives events for invoice payments processed through connected accounts
export async function POST(request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let event;

  try {
    // Verify webhook signature using the Connect webhook secret
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Connect webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // The `account` property identifies which connected account the event came from
  const connectedAccountId = event.account;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleInvoiceCheckoutCompleted(event.data.object, connectedAccountId);
        break;

      case "payment_intent.succeeded":
        await handleInvoicePaymentSucceeded(event.data.object, connectedAccountId);
        break;

      default:
        console.log(`Unhandled Connect event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Connect webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleInvoiceCheckoutCompleted(session, connectedAccountId) {
  // Only handle payment mode (not subscription)
  if (session.mode !== "payment") {
    return;
  }

  const invoiceId = session.metadata?.invoiceId;
  if (!invoiceId) {
    console.log("No invoiceId in checkout session metadata");
    return;
  }

  // Find the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: {
        select: {
          id: true,
          businessName: true,
          name: true,
          email: true,
          stripeAccountId: true,
        },
      },
    },
  });

  if (!invoice) {
    console.error(`Invoice not found: ${invoiceId}`);
    return;
  }

  // Verify the connected account matches
  if (invoice.tenant.stripeAccountId !== connectedAccountId) {
    console.error(`Connected account mismatch for invoice ${invoiceId}`);
    return;
  }

  // Update invoice status to paid
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: session.payment_intent,
    },
  });

  console.log(`Invoice ${invoice.invoiceNumber} marked as paid`);

  // Trigger webhook
  triggerWebhook(invoice.tenantId, "invoice.paid", updatedInvoice);

  // Send receipt email with PDF
  try {
    await sendInvoicePaidReceipt(updatedInvoice, invoice.tenant);
  } catch (emailError) {
    console.error("Failed to send invoice paid receipt:", emailError);
  }
}

async function handleInvoicePaymentSucceeded(paymentIntent, connectedAccountId) {
  const invoiceId = paymentIntent.metadata?.invoiceId;
  if (!invoiceId) {
    // Not an invoice payment
    return;
  }

  // Find the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      tenant: {
        select: {
          id: true,
          businessName: true,
          name: true,
          email: true,
          stripeAccountId: true,
        },
      },
    },
  });

  if (!invoice) {
    console.error(`Invoice not found for payment intent: ${invoiceId}`);
    return;
  }

  // Skip if already paid (checkout.session.completed may have already handled it)
  if (invoice.status === "paid") {
    console.log(`Invoice ${invoice.invoiceNumber} already marked as paid`);
    return;
  }

  // Verify the connected account matches
  if (invoice.tenant.stripeAccountId !== connectedAccountId) {
    console.error(`Connected account mismatch for invoice ${invoiceId}`);
    return;
  }

  // Update invoice status to paid
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "paid",
      paidAt: new Date(),
      stripePaymentIntentId: paymentIntent.id,
    },
  });

  console.log(`Invoice ${invoice.invoiceNumber} marked as paid via payment_intent`);

  // Trigger webhook
  triggerWebhook(invoice.tenantId, "invoice.paid", updatedInvoice);

  // Send receipt email with PDF
  try {
    await sendInvoicePaidReceipt(updatedInvoice, invoice.tenant);
  } catch (emailError) {
    console.error("Failed to send invoice paid receipt:", emailError);
  }
}
