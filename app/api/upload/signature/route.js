import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateUploadSignature } from "@/lib/cloudinary";

// GET /api/upload/signature - Get signed upload params for direct browser upload
export async function GET(request) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "No organization selected" },
        { status: 400 }
      );
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Require slug for uploads - it's set during business setup
    if (!tenant.slug) {
      return NextResponse.json(
        { error: "Business setup incomplete. Please complete your business profile first." },
        { status: 400 }
      );
    }

    // Generate signed upload parameters using slug for folder isolation
    const signatureData = generateUploadSignature(tenant.slug);

    return NextResponse.json(signatureData);
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
