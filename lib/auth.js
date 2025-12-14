import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { createSystemTagsForTenant } from "@/lib/system-tags";

// Internal API key for public routes (set in .env.local)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

// Helper to generate slug from org name
function generateSlugFromName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 50);
}

/**
 * Get the authenticated tenant from the request
 * Supports both Clerk session auth and API key auth
 * @param {Request} request - The incoming request
 * @returns {Promise<{tenant: object, error?: string, status?: number}>}
 */
export async function getAuthenticatedTenant(request) {
  try {
    // Check for API key authentication first
    const apiKey = request.headers.get("x-api-key");

    if (apiKey) {
      // Check for internal API key (environment variable)
      if (INTERNAL_API_KEY && apiKey === INTERNAL_API_KEY) {
        // For internal API key, we need the tenant slug in a header or query param
        const slug = request.headers.get("x-tenant-slug");
        if (slug) {
          const tenant = await prisma.tenant.findUnique({
            where: { slug },
          });
          if (tenant) {
            return { tenant, isInternal: true };
          }
        }
        // If no slug provided, return error
        return { tenant: null, error: "Tenant slug required for internal API key", status: 400 };
      }

      // Check database API keys
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { key: apiKey },
        include: { tenant: true },
      });

      if (!apiKeyRecord) {
        return { tenant: null, error: "Invalid API key", status: 401 };
      }

      // Update last used timestamp
      await prisma.apiKey.update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      });

      return { tenant: apiKeyRecord.tenant };
    }

    // Fall back to Clerk session auth
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return { tenant: null, error: "Unauthorized", status: 401 };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { clerkOrgId: orgId },
    });

    if (!tenant) {
      return { tenant: null, error: "Tenant not found", status: 404 };
    }

    return { tenant };
  } catch (error) {
    console.error("Authentication error:", error);
    return { tenant: null, error: "Authentication failed", status: 500 };
  }
}

/**
 * Get tenant by slug for public routes (no auth required)
 * This is used by the public API routes like /api/public/[slug]
 * @param {string} slug - The tenant slug
 * @returns {Promise<{tenant: object, error?: string, status?: number}>}
 */
export async function getPublicTenant(slug) {
  try {
    if (!slug) {
      return { tenant: null, error: "Slug is required", status: 400 };
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) {
      return { tenant: null, error: "Business not found", status: 404 };
    }

    return { tenant };
  } catch (error) {
    console.error("Error fetching public tenant:", error);
    return { tenant: null, error: "Failed to fetch business", status: 500 };
  }
}

/**
 * Get or create tenant from Clerk organization
 * Used during onboarding and first-time setup
 */
export async function getOrCreateTenant(orgId, userData = {}) {
  let tenant = await prisma.tenant.findUnique({
    where: { clerkOrgId: orgId },
  });

  if (!tenant) {
    // Fetch org data from Clerk to get name and slug
    let orgName = userData.name || "My Business";
    let orgSlug = null;

    try {
      const client = await clerkClient();
      const org = await client.organizations.getOrganization({ organizationId: orgId });
      if (org) {
        orgName = org.name || orgName;
        orgSlug = org.slug || generateSlugFromName(orgName);
      }
    } catch (error) {
      console.error("Error fetching org from Clerk:", error);
      orgSlug = generateSlugFromName(orgName);
    }

    // Ensure slug is unique
    let finalSlug = orgSlug;
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.tenant.findUnique({ where: { slug: finalSlug } });
      if (!existing) break;
      finalSlug = `${orgSlug}-${Math.random().toString(36).substring(2, 6)}`;
      attempts++;
    }

    tenant = await prisma.tenant.create({
      data: {
        clerkOrgId: orgId,
        name: orgName,
        businessName: orgName,
        slug: finalSlug,
        email: userData.email || "",
      },
    });

    // Create system tags for the new tenant
    try {
      await createSystemTagsForTenant(prisma, tenant.id);
    } catch (error) {
      console.error("Error creating system tags for tenant:", error);
    }
  }

  return tenant;
}
