import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchBookingCreated, dispatchContactCreated } from "@/lib/webhooks";
import { calculateAdjustedEndTime } from "@/lib/utils/schedule";
import { applyBookingStatusTag, convertLeadToClient } from "@/lib/system-tags";
import { triggerWorkflows } from "@/lib/workflow-executor";
import { sendBookingConfirmation } from "@/lib/send-system-email";

// POST /api/public/[slug]/book - Create a public booking
export async function POST(request, { params }) {
  try {
    const { slug } = await params;

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const {
      serviceId,
      packageId,
      serviceIds,
      packageIds,
      scheduledAt,
      contactId, // Optional: pre-saved lead ID from auto-save
      contactName,
      contactEmail,
      contactPhone,
      notes,
      totalDuration,
      totalPrice,
      customFields, // Array of { fieldId/fieldKey, value }
    } = body;

    // Normalize to arrays for multi-selection support
    const selectedServiceIds = serviceIds?.length > 0
      ? serviceIds
      : (serviceId ? [serviceId] : []);
    const selectedPackageIds = packageIds?.length > 0
      ? packageIds
      : (packageId ? [packageId] : []);

    // Validate required fields
    if (!contactName || !contactEmail || !scheduledAt) {
      return NextResponse.json(
        { error: "Name, email, and appointment time are required" },
        { status: 400 }
      );
    }

    if (selectedServiceIds.length === 0 && selectedPackageIds.length === 0) {
      return NextResponse.json(
        { error: "Please select a service or package" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Find the tenant by slug
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        email: true,
        businessName: true,
        businessPhone: true,
        businessAddress: true,
        businessCity: true,
        businessState: true,
        businessZip: true,
        bufferTime: true,
        breakStartTime: true,
        breakEndTime: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Get the services and packages to calculate price and duration
    let calculatedPrice = 0;
    let calculatedDuration = 0;
    const selectedServices = [];
    const selectedPackages = [];

    // Fetch and validate all selected services
    if (selectedServiceIds.length > 0) {
      const services = await prisma.service.findMany({
        where: {
          id: { in: selectedServiceIds },
          tenantId: tenant.id,
          active: true,
        },
      });

      if (services.length !== selectedServiceIds.length) {
        return NextResponse.json({ error: "One or more services not found" }, { status: 404 });
      }

      services.forEach((service) => {
        calculatedPrice += service.price;
        calculatedDuration += service.duration;
        selectedServices.push(service);
      });
    }

    // Fetch and validate all selected packages
    if (selectedPackageIds.length > 0) {
      const pkgs = await prisma.package.findMany({
        where: {
          id: { in: selectedPackageIds },
          tenantId: tenant.id,
          active: true,
        },
        include: {
          services: {
            include: { service: true },
          },
        },
      });

      if (pkgs.length !== selectedPackageIds.length) {
        return NextResponse.json({ error: "One or more packages not found" }, { status: 404 });
      }

      pkgs.forEach((pkg) => {
        calculatedPrice += pkg.price;
        calculatedDuration += pkg.services.reduce((sum, ps) => sum + ps.service.duration, 0);
        selectedPackages.push(pkg);
      });
    }

    // Use provided totals if available (for UI-calculated values), otherwise use calculated
    const finalPrice = totalPrice || calculatedPrice;
    const finalDuration = totalDuration || calculatedDuration;

    // Use a transaction to prevent race conditions between conflict check and booking creation
    const { booking, contact, isNewContact } = await prisma.$transaction(async (tx) => {
      // Check for conflicting bookings (including buffer time and break periods)
      const appointmentStart = new Date(scheduledAt);

      // Calculate adjusted end time accounting for break period
      const appointmentEnd = calculateAdjustedEndTime(
        appointmentStart,
        finalDuration,
        tenant.breakStartTime,
        tenant.breakEndTime
      );

      // Buffer time should only be added ONCE between appointments, not doubled
      // We add it to the end of THIS appointment when checking conflicts
      const bufferTimeMs = (tenant.bufferTime || 0) * 60000;
      const checkStart = appointmentStart;
      const checkEnd = new Date(appointmentEnd.getTime() + bufferTimeMs);

      const conflictingBooking = await tx.booking.findFirst({
        where: {
          tenantId: tenant.id,
          status: { in: ["pending", "confirmed", "inquiry", "scheduled"] },
          AND: [
            {
              scheduledAt: { lt: checkEnd },
            },
            {
              scheduledAt: { gte: new Date(checkStart.getTime() - 24 * 60 * 60000) },
            },
          ],
        },
        select: {
          scheduledAt: true,
          duration: true,
        },
      });

      if (conflictingBooking) {
        const existingStart = conflictingBooking.scheduledAt;

        // Calculate adjusted end time for existing booking (accounting for break period)
        const existingEnd = calculateAdjustedEndTime(
          existingStart,
          conflictingBooking.duration,
          tenant.breakStartTime,
          tenant.breakEndTime
        );

        // Add buffer time only once - to the end of the existing booking
        const existingCheckEnd = new Date(existingEnd.getTime() + bufferTimeMs);

        // Check if appointments overlap
        // New booking starts before existing ends (with buffer) AND new booking ends after existing starts
        if (checkStart < existingCheckEnd && checkEnd > existingStart) {
          throw new Error("CONFLICT:This time slot is no longer available. Please choose a different time.");
        }
      }

      // Find or create the contact
      // If contactId is provided (from auto-save), use that contact
      let foundContact = null;
      let newContactFlag = false;

      if (contactId) {
        // Use the pre-saved contact from auto-save
        foundContact = await tx.contact.findFirst({
          where: {
            id: contactId,
            tenantId: tenant.id,
          },
        });
        // Update contact info if provided and different
        if (foundContact) {
          const updates = {};
          if (contactName && contactName !== foundContact.name) updates.name = contactName;
          if (contactPhone && contactPhone !== foundContact.phone) updates.phone = contactPhone;
          if (Object.keys(updates).length > 0) {
            foundContact = await tx.contact.update({
              where: { id: foundContact.id },
              data: updates,
            });
          }
        }
      }

      // Fallback to finding by email if contactId not found or not provided
      if (!foundContact) {
        foundContact = await tx.contact.findFirst({
          where: {
            tenantId: tenant.id,
            email: contactEmail.toLowerCase(),
          },
        });
      }

      // Create new contact if not found
      if (!foundContact) {
        foundContact = await tx.contact.create({
          data: {
            tenantId: tenant.id,
            name: contactName,
            email: contactEmail.toLowerCase(),
            phone: contactPhone || null,
          },
        });
        newContactFlag = true;
      }

      // Create the booking (store first service/package for backward compatibility)
      const primaryServiceId = selectedServiceIds.length > 0 ? selectedServiceIds[0] : null;
      const primaryPackageId = selectedPackageIds.length > 0 && selectedServiceIds.length === 0
        ? selectedPackageIds[0]
        : null;

      const createdBooking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          contactId: foundContact.id,
          serviceId: primaryServiceId,
          packageId: primaryPackageId,
          scheduledAt: new Date(scheduledAt),
          status: "pending", // Awaiting payment or business confirmation
          notes: notes || null,
          totalPrice: finalPrice,
          duration: finalDuration,
          paymentStatus: "unpaid",
        },
        include: {
          service: { select: { name: true } },
          package: { select: { name: true } },
        },
      });

      return {
        booking: createdBooking,
        contact: foundContact,
        isNewContact: newContactFlag,
      };
    });

    // Determine booking status based on price
    // Free bookings (price = 0) are confirmed immediately
    // Paid bookings remain pending until payment is received
    const isFreeBooking = finalPrice === 0;
    const bookingStatus = isFreeBooking ? "confirmed" : "pending";

    // Update booking status if it's free
    if (isFreeBooking && booking.status !== "confirmed") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "confirmed", paymentStatus: "not_required" },
      });
    }

    // Apply booking status tag
    await applyBookingStatusTag(prisma, booking.id, tenant.id, bookingStatus, { tenant });

    // Convert lead to client for free bookings (no payment required)
    if (isFreeBooking && contact.id) {
      convertLeadToClient(prisma, contact.id, tenant.id, {
        tenant,
        contact,
      }).catch((err) => {
        console.error("Error converting lead to client for free booking:", err);
      });

      // Trigger client_converted workflow for free bookings
      triggerWorkflows("booking_confirmed", {
        tenant,
        booking,
        contact,
      }).catch((err) => {
        console.error("Error triggering booking_confirmed workflow:", err);
      });

      // Send booking confirmation email for free bookings
      sendBookingConfirmation({
        ...booking,
        tenant,
        contact,
        service: selectedServices[0] || null,
        package: selectedPackages[0] || null,
      }).catch((err) => {
        console.error("Error sending booking confirmation email:", err);
      });
    }

    // Save custom field values if provided
    if (customFields && Array.isArray(customFields) && customFields.length > 0) {
      try {
        // Get active custom fields for this tenant
        const activeFields = await prisma.customField.findMany({
          where: {
            tenantId: tenant.id,
            active: true,
          },
          select: {
            id: true,
            key: true,
            fieldType: true,
          },
        });

        const fieldsByKey = activeFields.reduce((acc, f) => {
          acc[f.key] = f;
          return acc;
        }, {});

        const fieldsById = activeFields.reduce((acc, f) => {
          acc[f.id] = f;
          return acc;
        }, {});

        // Process and save custom field values
        const valuesToUpsert = [];
        for (const cf of customFields) {
          const field = cf.fieldId ? fieldsById[cf.fieldId] : fieldsByKey[cf.fieldKey];
          if (!field) continue;

          let stringValue = "";
          const value = cf.value;
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              stringValue = value.join(",");
            } else if (typeof value === "boolean") {
              stringValue = value ? "true" : "false";
            } else {
              stringValue = String(value);
            }
          }

          valuesToUpsert.push({
            contactId: contact.id,
            fieldId: field.id,
            value: stringValue,
          });
        }

        if (valuesToUpsert.length > 0) {
          await prisma.$transaction(
            valuesToUpsert.map((v) =>
              prisma.contactCustomFieldValue.upsert({
                where: {
                  contactId_fieldId: {
                    contactId: v.contactId,
                    fieldId: v.fieldId,
                  },
                },
                update: { value: v.value },
                create: v,
              })
            )
          );
        }
      } catch (cfError) {
        // Log but don't fail the booking for custom field errors
        console.error("Error saving custom field values:", cfError);
      }
    }

    // Build service name for response
    const allNames = [
      ...selectedServices.map(s => s.name),
      ...selectedPackages.map(p => p.name),
    ];
    const serviceName = allNames.length > 0
      ? allNames.length === 1
        ? allNames[0]
        : `${allNames.length} items`
      : booking.service?.name || booking.package?.name;

    // Dispatch webhook events (fire and forget)
    dispatchBookingCreated(tenant.id, {
      ...booking,
      contact: { id: contact.id, name: contact.name, email: contact.email },
    }).catch((err) => console.error("Failed to dispatch booking.created webhook:", err));

    if (isNewContact) {
      dispatchContactCreated(tenant.id, contact).catch((err) =>
        console.error("Failed to dispatch contact.created webhook:", err)
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        scheduledAt: booking.scheduledAt,
        serviceName,
        totalPrice: booking.totalPrice,
        status: bookingStatus,
      },
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
      },
      message: isFreeBooking
        ? "Your booking is confirmed! A confirmation email has been sent to your email address."
        : "Your booking request has been submitted! We'll confirm your appointment shortly.",
    });
  } catch (error) {
    console.error("Error creating public booking:", error);

    // Handle conflict errors specifically
    if (error.message?.startsWith("CONFLICT:")) {
      return NextResponse.json(
        { error: error.message.replace("CONFLICT:", "") },
        { status: 409 }
      );
    }

    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
