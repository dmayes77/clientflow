import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedTenant } from "@/lib/auth";
import { updateInvoiceSchema, validateRequest } from "@/lib/validations";
import { sendPaymentConfirmation } from "@/lib/email";
import { applyInvoiceStatusTag } from "@/lib/system-tags";
import { triggerWorkflows } from "@/lib/workflow-executor";

// GET /api/invoices/[id] - Get a single invoice
export async function GET(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
      include: {
        contact: true,
        booking: {
          include: {
            service: true,
            package: true,
            services: { include: { service: true } },
            packages: { include: { package: true } },
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
        payments: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                cardBrand: true,
                cardLast4: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    console.log("[GET /api/invoices/[id]] Returning invoice:", JSON.stringify({
      id: invoice.id,
      depositPercent: invoice.depositPercent,
      depositAmount: invoice.depositAmount,
      hasCoupons: invoice.coupons?.length > 0,
      paymentsCount: invoice.payments?.length || 0,
    }));

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update an invoice
export async function PATCH(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await request.json();
    console.log("[PATCH /api/invoices/[id]] Request body:", JSON.stringify(body));

    // Preprocess: convert empty strings to undefined for optional fields
    const cleanedBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === "" ? undefined : value])
    );

    const { success, data, errors } = validateRequest(cleanedBody, updateInvoiceSchema);

    if (!success) {
      console.error("[PATCH /api/invoices/[id]] Validation failed:", errors);
      return NextResponse.json({ error: "Validation failed", details: errors }, { status: 400 });
    }

    console.log("[PATCH /api/invoices/[id]] Validated data:", JSON.stringify({
      status: data.status,
      depositPercent: data.depositPercent,
      couponId: data.couponId,
      couponDiscountAmount: data.couponDiscountAmount
    }));

    console.log("[PATCH /api/invoices/[id]] Existing invoice status:", existingInvoice.status);

    // Handle status transitions
    const statusUpdates = {};
    if (data.status && data.status !== existingInvoice.status) {
      console.log("[PATCH /api/invoices/[id]] Status changing from", existingInvoice.status, "to", data.status);

      // VALIDATION: Prevent invalid state transitions
      // Draft can only go to sent, not directly to paid
      if (existingInvoice.status === "draft" && data.status === "paid") {
        return NextResponse.json(
          { error: "Cannot mark draft invoice as paid. Invoice must be sent first." },
          { status: 400 }
        );
      }

      // Transitioning TO sent
      if (data.status === "sent" && !existingInvoice.sentAt) {
        statusUpdates.sentAt = new Date();
      }

      // Transitioning TO paid
      if (data.status === "paid" && !existingInvoice.paidAt) {
        console.log("[PATCH /api/invoices/[id]] Marking invoice as paid");
        statusUpdates.paidAt = new Date();
        statusUpdates.amountPaid = existingInvoice.total; // Mark full amount as paid
        statusUpdates.balanceDue = 0; // No balance remaining
      }

      // Transitioning AWAY FROM paid (back to draft or sent)
      if (existingInvoice.status === "paid" && data.status !== "paid") {
        console.log("[PATCH /api/invoices/[id]] Clearing paid status fields");
        statusUpdates.paidAt = null;
        statusUpdates.amountPaid = 0;
        statusUpdates.balanceDue = existingInvoice.total; // Restore full balance
      }

      // Transitioning back to draft from sent
      if (existingInvoice.status === "sent" && data.status === "draft") {
        console.log("[PATCH /api/invoices/[id]] Clearing sent status");
        statusUpdates.sentAt = null;
      }
    }

    // If deposit is already paid, preserve the existing deposit percent (ignore form value)
    // Only error if explicitly trying to change to a DIFFERENT non-null value
    if (existingInvoice.depositPaidAt) {
      const incomingPercent = data.depositPercent;
      const existingPercent = existingInvoice.depositPercent;
      // Only reject if trying to change to a different positive value
      if (incomingPercent !== undefined && incomingPercent !== null && incomingPercent > 0 && incomingPercent !== existingPercent) {
        return NextResponse.json(
          { error: "Cannot change deposit after it has been paid" },
          { status: 400 }
        );
      }
      // Otherwise, always use the existing percent (ignore null/undefined from form)
      data.depositPercent = existingPercent;
    }

    // Safely handle deposit percent - use new value if provided, otherwise keep existing
    const total = data.total ?? existingInvoice.total;
    const rawDepositPercent = data.depositPercent !== undefined ? data.depositPercent : existingInvoice.depositPercent;
    // Ensure deposit percent is a valid positive integer or null
    const safeDepositPercent = (rawDepositPercent !== null && rawDepositPercent !== undefined && rawDepositPercent > 0)
      ? rawDepositPercent
      : null;
    const depositAmount = safeDepositPercent ? Math.round(total * (safeDepositPercent / 100)) : null;

    // Filter out fields that shouldn't be passed to Prisma update
    // contactId, bookingId, bookingIds - relation fields handled separately
    // couponId, couponDiscountAmount - not fields on Invoice model, handled separately
    const { contactId, bookingId, bookingIds, couponId, couponDiscountAmount, ...validData } = data;

    // Ensure depositPercent is explicitly set in data for the update
    const dataWithDeposit = {
      ...validData,
      depositPercent: safeDepositPercent,
    };

    console.log("[PATCH /api/invoices/[id]] Updating with:", JSON.stringify({
      depositPercent: safeDepositPercent,
      depositAmount: depositAmount,
      status: dataWithDeposit.status,
      statusUpdates: statusUpdates
    }));

    // Remove undefined values from dataWithDeposit to prevent Prisma issues
    const cleanedData = Object.fromEntries(
      Object.entries(dataWithDeposit).filter(([_, value]) => value !== undefined)
    );

    console.log("[PATCH /api/invoices/[id]] Cleaned data keys:", Object.keys(cleanedData));

    // Log edits to paid invoices for audit trail
    let editHistoryUpdate = {};
    if (existingInvoice.status === "paid") {
      const changes = [];

      // Detect booking link changes
      const newBookingId = bookingId || (bookingIds && bookingIds[0]) || null;
      // We need to check current booking - fetch it
      const currentBooking = await prisma.booking.findFirst({
        where: { invoiceId: id },
        select: { id: true },
      });
      const currentBookingId = currentBooking?.id || null;

      if (newBookingId !== currentBookingId) {
        if (newBookingId && !currentBookingId) {
          changes.push(`Linked booking ${newBookingId.slice(-8).toUpperCase()}`);
        } else if (!newBookingId && currentBookingId) {
          changes.push(`Unlinked booking ${currentBookingId.slice(-8).toUpperCase()}`);
        } else if (newBookingId && currentBookingId) {
          changes.push(`Changed booking from ${currentBookingId.slice(-8).toUpperCase()} to ${newBookingId.slice(-8).toUpperCase()}`);
        }
      }

      // Detect notes changes
      if (cleanedData.notes !== undefined && cleanedData.notes !== existingInvoice.notes) {
        changes.push("Updated notes");
      }

      // Detect terms changes
      if (cleanedData.terms !== undefined && cleanedData.terms !== existingInvoice.terms) {
        changes.push("Updated terms");
      }

      // If there are changes, add to edit history
      if (changes.length > 0) {
        const existingHistory = Array.isArray(existingInvoice.editHistory) ? existingInvoice.editHistory : [];
        const newEntry = {
          editedAt: new Date().toISOString(),
          description: changes.join(", "),
        };
        editHistoryUpdate = { editHistory: [...existingHistory, newEntry] };
        console.log("[PATCH /api/invoices/[id]] Recording edit to paid invoice:", newEntry);
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...cleanedData,
        ...statusUpdates,
        ...editHistoryUpdate,
        depositAmount,
      },
      include: {
        contact: true,
        booking: {
          include: {
            service: true,
            package: true,
            services: { include: { service: true } },
            packages: { include: { package: true } },
          },
        },
        coupons: {
          include: {
            coupon: true,
          },
        },
        payments: {
          include: {
            payment: {
              select: {
                id: true,
                amount: true,
                status: true,
                cardBrand: true,
                cardLast4: true,
                metadata: true,
                createdAt: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Handle booking updates if bookingIds provided
    const newBookingIds = bookingIds || (bookingId ? [bookingId] : null);
    if (newBookingIds !== null) {
      // First, unlink any bookings currently linked to this invoice
      await prisma.booking.updateMany({
        where: { invoiceId: id },
        data: { invoiceId: null },
      });

      // Then link the new bookings
      if (newBookingIds.length > 0) {
        await prisma.booking.updateMany({
          where: { id: { in: newBookingIds } },
          data: { invoiceId: id },
        });
      }
    }

    // Handle coupon updates if couponId changed
    if (couponId !== undefined) {
      // Remove existing coupon associations
      await prisma.invoiceCoupon.deleteMany({
        where: { invoiceId: id },
      });

      // Add new coupon if provided
      if (couponId && couponDiscountAmount) {
        const coupon = await prisma.coupon.findUnique({
          where: { id: couponId },
        });

        if (coupon) {
          await prisma.invoiceCoupon.create({
            data: {
              invoiceId: id,
              couponId: couponId,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              calculatedAmount: couponDiscountAmount,
            },
          });

          // Increment usage counter
          await prisma.coupon.update({
            where: { id: couponId },
            data: { currentUses: { increment: 1 } },
          });
        }
      }
    }

    // Apply status tag and trigger workflows if status changed
    if (data.status && data.status !== existingInvoice.status) {
      await applyInvoiceStatusTag(prisma, invoice.id, tenant.id, invoice.status);

      // Trigger invoice_sent workflow
      if (invoice.status === "sent") {
        triggerWorkflows("invoice_sent", {
          tenant,
          invoice,
          contact: invoice.contact,
        }).catch((err) => {
          console.error("Error triggering invoice_sent workflow:", err);
        });
      }

      // Trigger invoice_paid workflow
      if (invoice.status === "paid") {
        triggerWorkflows("invoice_paid", {
          tenant,
          invoice,
          contact: invoice.contact,
        }).catch((err) => {
          console.error("Error triggering invoice_paid workflow:", err);
        });
      }
    }

    // Send payment confirmation email if payment was recorded
    const paymentRecorded =
      (data.amountPaid !== undefined && data.amountPaid > (existingInvoice.amountPaid || 0)) ||
      (data.status === "paid" && existingInvoice.status !== "paid") ||
      (data.paidAt && !existingInvoice.paidAt);

    if (paymentRecorded && invoice.contact?.email) {
      try {
        console.log(`[PATCH /api/invoices/[id]] Sending payment confirmation for invoice ${invoice.invoiceNumber}`);
        await sendPaymentConfirmation({
          to: invoice.contact.email,
          contactName: invoice.contact.name || invoice.contact.email,
          businessName: tenant.businessName || "Your Business",
          invoiceNumber: invoice.invoiceNumber,
          amountPaid: invoice.amountPaid || invoice.total,
          balanceDue: invoice.balanceDue || 0,
          currency: invoice.currency || "usd",
          paidAt: invoice.paidAt || new Date(),
          viewUrl: null, // TODO: Add public invoice view URL when customer portal is ready
          tenantId: tenant.id, // For template lookup
        });
        console.log(`[PATCH /api/invoices/[id]] Payment confirmation sent successfully`);
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("[PATCH /api/invoices/[id]] Failed to send payment confirmation:", emailError);
      }
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request, { params }) {
  try {
    const { tenant, error, status } = await getAuthenticatedTenant(request);

    if (!tenant) {
      return NextResponse.json({ error }, { status });
    }

    const { id } = await params;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Only allow deleting draft invoices
    if (existingInvoice.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft invoices can be deleted" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
