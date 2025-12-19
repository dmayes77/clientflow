import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";

// GET /api/stripe/terminal/location - Get Terminal Location status
export async function GET(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check if tenant has Stripe Connect set up
    if (!tenant.stripeAccountId || !tenant.stripeOnboardingComplete) {
      return NextResponse.json({
        hasLocation: false,
        requiresStripeConnect: true,
        message: "Please connect your Stripe account first",
      });
    }

    // Check if location already exists
    if (tenant.stripeTerminalLocationId) {
      try {
        // Verify the location still exists in Stripe
        const location = await stripe.terminal.locations.retrieve(
          tenant.stripeTerminalLocationId,
          { stripeAccount: tenant.stripeAccountId }
        );

        return NextResponse.json({
          hasLocation: true,
          location: {
            id: location.id,
            displayName: location.display_name,
            address: location.address,
          },
        });
      } catch (stripeError) {
        // Location was deleted from Stripe, clear our reference
        if (stripeError.code === "resource_missing") {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { stripeTerminalLocationId: null },
          });

          return NextResponse.json({
            hasLocation: false,
            message: "Terminal location needs to be created",
          });
        }
        throw stripeError;
      }
    }

    return NextResponse.json({
      hasLocation: false,
      message: "No Terminal location set up",
    });
  } catch (error) {
    console.error("Error fetching Terminal location:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/stripe/terminal/location - Create Terminal Location
export async function POST(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    // Check if tenant has Stripe Connect set up
    if (!tenant.stripeAccountId || !tenant.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "Please connect your Stripe account first" },
        { status: 400 }
      );
    }

    // Check if location already exists
    if (tenant.stripeTerminalLocationId) {
      return NextResponse.json(
        { error: "Terminal location already exists" },
        { status: 400 }
      );
    }

    // Get location details from request body or use tenant's business address
    const body = await request.json().catch(() => ({}));

    // Build address from tenant data or request body
    const address = {
      line1: body.line1 || tenant.businessAddress || "123 Main St",
      city: body.city || tenant.businessCity || "New York",
      state: body.state || tenant.businessState || "NY",
      postal_code: body.postalCode || tenant.businessZip || "10001",
      country: body.country || tenant.businessCountry || "US",
    };

    // Create the Terminal location on the connected account
    const location = await stripe.terminal.locations.create(
      {
        display_name: body.displayName || tenant.businessName || tenant.name,
        address,
      },
      { stripeAccount: tenant.stripeAccountId }
    );

    // Save the location ID to the tenant
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeTerminalLocationId: location.id },
    });

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        displayName: location.display_name,
        address: location.address,
      },
    });
  } catch (error) {
    console.error("Error creating Terminal location:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/stripe/terminal/location - Delete Terminal Location
export async function DELETE(request) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    if (!tenant.stripeTerminalLocationId) {
      return NextResponse.json(
        { error: "No Terminal location to delete" },
        { status: 400 }
      );
    }

    // First, check if there are any readers at this location
    const readers = await prisma.terminalReader.findMany({
      where: { tenantId: tenant.id },
    });

    if (readers.length > 0) {
      return NextResponse.json(
        { error: "Please remove all readers before deleting the location" },
        { status: 400 }
      );
    }

    try {
      // Delete from Stripe
      await stripe.terminal.locations.del(tenant.stripeTerminalLocationId, {
        stripeAccount: tenant.stripeAccountId,
      });
    } catch (stripeError) {
      // Ignore if already deleted
      if (stripeError.code !== "resource_missing") {
        throw stripeError;
      }
    }

    // Clear from tenant record
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeTerminalLocationId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting Terminal location:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
