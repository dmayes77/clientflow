import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { sendInvoiceEmail } from "@/lib/email";
import { applyBookingStatusTag } from "@/lib/system-tags";

// GET /api/public/[slug]/verify-payment - Verify Stripe Checkout session and return booking info
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        businessName: true,
        stripeAccountId: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    if (!tenant.stripeAccountId) {
      return NextResponse.json({ error: "Payment not configured" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(
      sessionId,
      {
        expand: ["payment_intent", "payment_intent.latest_charge"],
      },
      {
        stripeAccount: tenant.stripeAccountId,
      }
    );

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      return NextResponse.json({ error: "Booking not found in session" }, { status: 400 });
    }

    // Get the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        service: { select: { name: true } },
        package: { select: { name: true } },
        services: { include: { service: { select: { name: true } } } },
        packages: { include: { package: { select: { name: true } } } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Parse metadata
    const isDeposit = session.metadata?.isDeposit === "true";
    const serviceTotal = parseInt(session.metadata?.serviceTotal || "0");
    const depositAmount = parseInt(session.metadata?.depositAmount || "0");
    const amountPaid = session.amount_total;
    const remainingBalance = isDeposit ? serviceTotal - depositAmount : 0;

    // Build service name early (needed for Payment Link description)
    const allNames = [];
    if (booking.services?.length > 0) {
      allNames.push(...booking.services.map((bs) => bs.service.name));
    } else if (booking.service) {
      allNames.push(booking.service.name);
    }
    if (booking.packages?.length > 0) {
      allNames.push(...booking.packages.map((bp) => bp.package.name));
    } else if (booking.package) {
      allNames.push(booking.package.name);
    }
    const serviceName = allNames.length > 0 ? allNames.join(", ") : "Service";

    // Get payment intent and charge details
    const paymentIntent = session.payment_intent;
    const charge = paymentIntent?.latest_charge;

    // Check if payment record already exists
    let payment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (!payment) {
      // Create payment record
      payment = await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          contactId: booking.contact?.id || null,
          bookingId: booking.id,
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: charge?.id || null,
          stripeAccountId: tenant.stripeAccountId,
          stripeReceiptUrl: charge?.receipt_url || null,
          amount: amountPaid,
          currency: session.currency || "usd",
          depositAmount: isDeposit ? depositAmount : null,
          serviceTotal: serviceTotal,
          clientEmail: booking.contact?.email || session.customer_email,
          clientName: booking.contact?.name || "",
          cardBrand: charge?.payment_method_details?.card?.brand || null,
          cardLast4: charge?.payment_method_details?.card?.last4 || null,
          status: "succeeded",
          capturedAt: new Date(),
          metadata: JSON.stringify(session.metadata),
        },
      });

      // Update booking payment status
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: isDeposit ? "deposit_paid" : "paid",
          paymentId: payment.id,
          status: "confirmed", // Auto-confirm when paid
        },
      });

      // Apply confirmed status tag
      await applyBookingStatusTag(prisma, booking.id, tenant.id, "confirmed", { tenant });

      // Create invoice for all payments
      if (isDeposit && remainingBalance > 0) {
        // Deposit payment - create invoice with payment link for remaining balance
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        // Create a Stripe Product for this balance payment
        const product = await stripe.products.create(
          {
            name: `Balance for ${serviceName}`,
            description: `Remaining balance for booking on ${new Date(booking.scheduledAt).toLocaleDateString()}`,
          },
          { stripeAccount: tenant.stripeAccountId }
        );

        // Create a one-time price for the balance
        const price = await stripe.prices.create(
          {
            unit_amount: remainingBalance,
            currency: "usd",
            product: product.id,
          },
          { stripeAccount: tenant.stripeAccountId }
        );

        // Create the Payment Link
        const paymentLink = await stripe.paymentLinks.create(
          {
            line_items: [{ price: price.id, quantity: 1 }],
            metadata: {
              bookingId: booking.id,
              tenantId: tenant.id,
              contactId: booking.contact?.id || "",
              invoiceNumber,
              type: "balance_payment",
            },
            after_completion: {
              type: "redirect",
              redirect: {
                url: `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/book/success?booking_id=${booking.id}&balance_paid=true`,
              },
            },
          },
          { stripeAccount: tenant.stripeAccountId }
        );

        // Create invoice with the Payment Link - detailed line items
        const invoice = await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            contactId: booking.contact?.id,
            bookingId: booking.id,
            invoiceNumber,
            status: "draft", // Will be marked sent after email
            issueDate: new Date(),
            dueDate: new Date(booking.scheduledAt), // Due by appointment date
            subtotal: serviceTotal,
            depositPercent: Math.round((depositAmount / serviceTotal) * 100),
            depositAmount: depositAmount,
            depositPaidAt: new Date(),
            total: serviceTotal,
            amountPaid: depositAmount,
            balanceDue: remainingBalance,
            stripePaymentLinkId: paymentLink.id,
            stripePaymentLinkUrl: paymentLink.url,
            lineItems: JSON.stringify([
              {
                description: serviceName,
                quantity: 1,
                unitPrice: serviceTotal,
                amount: serviceTotal,
              },
              {
                description: `Deposit paid (${Math.round((depositAmount / serviceTotal) * 100)}%)`,
                quantity: 1,
                unitPrice: depositAmount,
                amount: -depositAmount,
                isDiscount: true,
              },
            ]),
            contactName: booking.contact?.name || "",
            contactEmail: booking.contact?.email || "",
            notes: `Thank you for your deposit! The remaining balance is due by your appointment date.`,
          },
        });

        // Get tenant business info for email
        const tenantInfo = await prisma.tenant.findUnique({
          where: { id: tenant.id },
          select: {
            businessName: true,
            name: true,
            slug: true,
          },
        });

        // Send invoice email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getclientflow.app";
        const emailResult = await sendInvoiceEmail({
          to: booking.contact?.email,
          contactName: booking.contact?.name || "Customer",
          businessName: tenantInfo?.businessName || tenantInfo?.name || "Business",
          invoiceNumber,
          total: remainingBalance,
          currency: "usd",
          dueDate: booking.scheduledAt,
          viewUrl: `${baseUrl}/invoice/${invoice.id}`,
          payUrl: paymentLink.url,
        });

        // Update invoice status to sent if email succeeded
        if (emailResult.success) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: "sent",
              sentAt: new Date(),
            },
          });
        }
      } else {
        // Full payment - create a paid invoice
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            contactId: booking.contact?.id,
            bookingId: booking.id,
            invoiceNumber,
            status: "paid",
            issueDate: new Date(),
            dueDate: new Date(),
            paidAt: new Date(),
            subtotal: serviceTotal,
            total: serviceTotal,
            amountPaid: amountPaid,
            balanceDue: 0,
            lineItems: JSON.stringify([
              {
                description: serviceName,
                quantity: 1,
                unitPrice: serviceTotal,
                amount: serviceTotal,
              },
            ]),
            contactName: booking.contact?.name || "",
            contactEmail: booking.contact?.email || "",
            notes: `Payment received in full. Thank you for your business!`,
          },
        });
      }
    }

    // Get the invoice with payment link if deposit was paid
    let paymentLinkUrl = null;
    if (isDeposit && remainingBalance > 0) {
      const invoice = await prisma.invoice.findFirst({
        where: {
          booking: { id: booking.id },
          tenantId: tenant.id,
        },
        select: {
          stripePaymentLinkUrl: true,
        },
      });
      paymentLinkUrl = invoice?.stripePaymentLinkUrl || null;
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amountPaid,
        serviceTotal,
        isDeposit,
        depositAmount: isDeposit ? depositAmount : null,
        remainingBalance,
        receiptUrl: charge?.receipt_url || null,
        cardBrand: charge?.payment_method_details?.card?.brand || null,
        cardLast4: charge?.payment_method_details?.card?.last4 || null,
        paymentLinkUrl,
      },
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        duration: booking.duration,
        serviceName,
        totalPrice: booking.totalPrice,
        status: "confirmed",
      },
      business: {
        name: tenant.businessName || tenant.name,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
