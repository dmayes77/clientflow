import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/book(.*)",
  "/offline",
  "/api/public(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/stripe/webhook(.*)",
]);

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// Check if route is a tenant public page (matches [slug] pattern)
function isTenantRoute(pathname) {
  // Skip API routes, auth routes, and static routes
  if (pathname.startsWith("/api/") ||
      pathname.startsWith("/sign-") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/book") ||
      pathname.startsWith("/offline")) {
    return false;
  }
  // Match patterns like /some-slug (business profile pages)
  const tenantPattern = /^\/[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  return tenantPattern.test(pathname);
}

export const proxy = clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const { userId } = await auth();

  // Redirect authenticated users away from auth pages to dashboard
  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect non-public routes - redirects to sign-in if not authenticated
  if (!isPublicRoute(req) && !isTenantRoute(pathname)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
