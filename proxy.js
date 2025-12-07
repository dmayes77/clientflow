import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Routes that require authentication
const protectedRoutes = [
  "/onboarding",
  "/michelle",
  "/dashboard",
];

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/pricing",
  "/documentation",
  "/api-reference",
  "/support",
  "/website-development",
  "/founders",
  "/roadmap",
  "/privacy",
  "/terms",
  "/book(.*)",
  "/api/calendar(.*)",
  "/api/public(.*)",
  "/api/webhooks/clerk(.*)",
]);

// Check if route is a tenant public page (matches [slug] pattern)
function isTenantRoute(pathname) {
  // Skip if it's a known protected route
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    return false;
  }
  // Skip API routes, auth routes, and static routes
  if (pathname.startsWith("/api/") ||
      pathname.startsWith("/sign-") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/michelle")) {
    return false;
  }
  // Match patterns like /some-slug or /some-slug/book
  const tenantPattern = /^\/[a-z0-9][a-z0-9-]*[a-z0-9](\/book)?$/;
  return tenantPattern.test(pathname);
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  // Allow public routes and tenant public pages
  if (!isPublicRoute(req) && !isTenantRoute(pathname)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
