import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("Missing CLERK_WEBHOOK_SECRET environment variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Get the headers
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the webhook
  const eventType = evt.type;

  try {
    switch (eventType) {
      case "organization.created":
        await handleOrganizationCreated(evt.data);
        break;

      case "organization.updated":
        await handleOrganizationUpdated(evt.data);
        break;

      case "organization.deleted":
        await handleOrganizationDeleted(evt.data);
        break;

      case "organizationMembership.created":
        // User joined an organization
        console.log(`User joined organization: ${evt.data.organization.id}`);
        break;

      default:
        console.log(`Unhandled Clerk event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleOrganizationCreated(data) {
  const { id: clerkOrgId, name, created_by } = data;

  // Check if tenant already exists for this org
  const existingTenant = await prisma.tenant.findFirst({
    where: { clerkOrgId },
  });

  if (existingTenant) {
    console.log(`Tenant already exists for org ${clerkOrgId}`);
    return;
  }

  // Get the creator's email from Clerk (if available in the event data)
  // The created_by is the user ID who created the org
  let email = "";

  // Try to get email from the public metadata or use a placeholder
  // In production, you might want to fetch the user from Clerk API
  if (data.public_metadata?.email) {
    email = data.public_metadata.email;
  }

  // Create the tenant with pending subscription status
  const tenant = await prisma.tenant.create({
    data: {
      name: name || "New Business",
      email: email,
      clerkOrgId: clerkOrgId,
      subscriptionStatus: "pending", // Not yet subscribed
      planType: null, // No plan yet
      setupComplete: false,
    },
  });

  console.log(`Created tenant ${tenant.id} for organization ${clerkOrgId} (pending subscription)`);
}

async function handleOrganizationUpdated(data) {
  const { id: clerkOrgId, name } = data;

  const tenant = await prisma.tenant.findFirst({
    where: { clerkOrgId },
  });

  if (!tenant) {
    console.log(`No tenant found for org ${clerkOrgId}`);
    return;
  }

  // Update both name (Clerk org name) and businessName (display name)
  // Only update businessName if it's not already set or matches the old name
  const updateData = { name };
  if (!tenant.businessName || tenant.businessName === tenant.name) {
    updateData.businessName = name;
  }

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: updateData,
  });

  console.log(`Updated tenant ${tenant.id} name to ${name}`);
}

async function handleOrganizationDeleted(data) {
  const { id: clerkOrgId } = data;

  const tenant = await prisma.tenant.findFirst({
    where: { clerkOrgId },
  });

  if (!tenant) {
    console.log(`No tenant found for org ${clerkOrgId}`);
    return;
  }

  // Soft delete or mark as inactive (don't hard delete for data retention)
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      subscriptionStatus: "deleted",
    },
  });

  console.log(`Marked tenant ${tenant.id} as deleted`);
}
