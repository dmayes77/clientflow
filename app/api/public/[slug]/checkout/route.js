import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/public/[slug]/checkout - Create Stripe Checkout session for booking payment
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      bookingId,
      paymentOption, // "full" or "deposit"
      contactEmail,
      contactName,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
    }

    // Find the tenant by slug with payment settings
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        businessName: true,
        name: true,
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
        requirePayment: true,
        paymentType: true,
        depositType: true,
        depositValue: true,
        payInFullDiscount: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Check if Stripe Connect is set up
    if (!tenant.stripeAccountId || tenant.stripeAccountStatus !== "active") {
      return NextResponse.json(
        { error: "This business has not set up payment processing" },
        { status: 400 }
      );
    }

    // Check if payment is required
    if (!tenant.requirePayment) {
      return NextResponse.json(
        { error: "This business does not require payment for bookings" },
        { status: 400 }
      );
    }

    // Get the booking
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        service: { select: { id: true, name: true, price: true } },
        package: { select: { id: true, name: true, price: true } },
        services: { include: { service: { select: { id: true, name: true, price: true } } } },
        packages: { include: { package: { select: { id: true, name: true, price: true } } } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Don't allow payment if already paid
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "This booking has already been paid" }, { status: 400 });
    }

    const serviceTotal = booking.totalPrice;
    let amountToCharge = serviceTotal;
    let depositAmount = null;
    let isDeposit = false;

    // Calculate amount based on payment type and option selected
    if (tenant.paymentType === "deposit") {
      // Tenant allows deposits
      if (paymentOption === "deposit") {
        // Customer chose to pay deposit only
        isDeposit = true;
        if (tenant.depositType === "percentage") {
          depositAmount = Math.round(serviceTotal * (tenant.depositValue / 100));
        } else {
          // Fixed amount - but cap at service total
          depositAmount = Math.min(tenant.depositValue, serviceTotal);
        }
        amountToCharge = depositAmount;
      } else {
        // Customer chose to pay in full - apply discount if configured
        if (tenant.payInFullDiscount > 0) {
          amountToCharge = Math.round(serviceTotal * (1 - tenant.payInFullDiscount / 100));
        }
      }
    } else {
      // Full payment only - apply discount if configured
      if (tenant.payInFullDiscount > 0 && paymentOption === "full") {
        amountToCharge = Math.round(serviceTotal * (1 - tenant.payInFullDiscount / 100));
      }
    }

    // Build line items description
    const allServices = [];
    if (booking.services?.length > 0) {
      allServices.push(...booking.services.map((bs) => bs.service.name));
    } else if (booking.service) {
      allServices.push(booking.service.name);
    }
    if (booking.packages?.length > 0) {
      allServices.push(...booking.packages.map((bp) => bp.package.name));
    } else if (booking.package) {
      allServices.push(booking.package.name);
    }

    const serviceName = allServices.length > 0
      ? allServices.join(", ")
      : "Booking";

    const description = isDeposit
      ? `Deposit for: ${serviceName}`
      : `Payment for: ${serviceName}`;

    // Get or create Stripe Customer for the contact
    let stripeCustomerId = booking.contact?.stripeCustomerId;

    if (!stripeCustomerId && booking.contact) {
      const customer = await stripe.customers.create(
        {
          email: contactEmail || booking.contact.email,
          name: contactName || booking.contact.name,
          metadata: {
            contactId: booking.contact.id,
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
        where: { id: booking.contact.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Get the base URL for redirects
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: stripeCustomerId || undefined,
        customer_email: !stripeCustomerId ? (contactEmail || booking.contact?.email) : undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: serviceName,
                description: isDeposit
                  ? `Deposit - Remaining balance: $${((serviceTotal - depositAmount) / 100).toFixed(2)}`
                  : tenant.payInFullDiscount > 0 && paymentOption === "full"
                    ? `Full payment with ${tenant.payInFullDiscount}% discount`
                    : "Full payment",
              },
              unit_amount: amountToCharge,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          metadata: {
            bookingId: booking.id,
            tenantId: tenant.id,
            contactId: booking.contact?.id || "",
            isDeposit: isDeposit.toString(),
            serviceTotal: serviceTotal.toString(),
            depositAmount: depositAmount?.toString() || "",
          },
        },
        metadata: {
          bookingId: booking.id,
          tenantId: tenant.id,
          contactId: booking.contact?.id || "",
          isDeposit: isDeposit.toString(),
          serviceTotal: serviceTotal.toString(),
          depositAmount: depositAmount?.toString() || "",
        },
        success_url: `${origin}/book/${slug}/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
        cancel_url: `${origin}/book/${slug}?canceled=true&booking_id=${booking.id}`,
      },
      {
        stripeAccount: tenant.stripeAccountId,
      }
    );

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      amountCharged: amountToCharge,
      isDeposit,
      depositAmount,
      serviceTotal,
      remainingBalance: isDeposit ? serviceTotal - depositAmount : 0,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
