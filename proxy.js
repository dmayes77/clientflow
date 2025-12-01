import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Get the root domain from env or default
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'getclientflow.app'

// Helper to extract subdomain from host
function getSubdomain(host) {
  if (!host) return null

  // Remove port if present
  const hostname = host.split(':')[0]

  // For localhost development, check for subdomain patterns
  // e.g., dashboard.localhost, admin.localhost
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const parts = hostname.split('.')
    if (parts.length > 1 && parts[0] !== 'www') {
      return parts[0]
    }
    return null
  }

  // For production domain (e.g., dashboard.getclientflow.app)
  if (hostname.endsWith(ROOT_DOMAIN)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, '')
    if (subdomain && subdomain !== 'www' && subdomain !== ROOT_DOMAIN) {
      return subdomain
    }
  }

  return null
}

// Public routes for marketing site
const isPublicMarketingRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/welcome(.*)',
  '/support',
  '/documentation',
  '/api-reference',
  '/website-development',
  '/not-found',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/book(.*)',
])

// Public API routes (accessible from any subdomain)
const isPublicApiRoute = createRouteMatcher([
  '/api/stripe/checkout(.*)',
  '/api/stripe/webhook(.*)',
  '/api/stripe/billing-portal(.*)',
  '/api/stripe/verify-checkout(.*)',
  '/api/tenant/status(.*)',
  '/api/tenant/business(.*)',
  '/api/webhooks/clerk(.*)',
  '/api/test/process-checkout(.*)',
  '/api/test/reset-user(.*)',
  '/api/test/resend-magic-link(.*)',
  '/api/public(.*)',
])

// Onboarding routes (special handling)
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
  '/account(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const host = req.headers.get('host')
  const subdomain = getSubdomain(host)
  const pathname = req.nextUrl.pathname

  // Allow API routes through (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    if (!isPublicApiRoute(req)) {
      await auth.protect()
    }
    return addSecurityHeaders(req, NextResponse.next())
  }

  // Handle subdomain routing
  if (subdomain === 'dashboard') {
    // Dashboard subdomain - require auth and rewrite to /dashboard routes
    await auth.protect()

    // If already on /dashboard path, continue
    if (pathname.startsWith('/dashboard')) {
      return addSecurityHeaders(req, NextResponse.next())
    }

    // Rewrite root to /dashboard
    if (pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/dashboard'
      return addSecurityHeaders(req, NextResponse.rewrite(url))
    }

    // For other paths on dashboard subdomain, prefix with /dashboard
    const url = req.nextUrl.clone()
    url.pathname = `/dashboard${pathname}`
    return addSecurityHeaders(req, NextResponse.rewrite(url))
  }

  if (subdomain === 'admin') {
    // Admin subdomain - require auth and check for admin role
    await auth.protect()

    // Rewrite to /admin routes
    if (pathname === '/') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin'
      return addSecurityHeaders(req, NextResponse.rewrite(url))
    }

    if (!pathname.startsWith('/admin')) {
      const url = req.nextUrl.clone()
      url.pathname = `/admin${pathname}`
      return addSecurityHeaders(req, NextResponse.rewrite(url))
    }

    return addSecurityHeaders(req, NextResponse.next())
  }

  // No subdomain or www - this is the marketing site
  // Allow onboarding routes (they handle their own auth flow)
  if (isOnboardingRoute(req)) {
    return addSecurityHeaders(req, NextResponse.next())
  }

  // Protect dashboard/admin routes when accessed directly (without subdomain)
  // Use path-based routing (no subdomain redirects)
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    await auth.protect()
    return addSecurityHeaders(req, NextResponse.next())
  }

  // Public marketing routes
  if (isPublicMarketingRoute(req)) {
    return addSecurityHeaders(req, NextResponse.next())
  }

  // Everything else requires auth
  await auth.protect()
  return addSecurityHeaders(req, NextResponse.next())
})

// Add security headers to response
function addSecurityHeaders(req, response) {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.getclientflow.app https://clerk.getclientflow.app blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "worker-src 'self' blob:; " +
    "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.getclientflow.app https://clerk.getclientflow.app https://api.clerk.dev wss://*.clerk.accounts.dev; " +
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.getclientflow.app;"
  )

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  // Strict Transport Security (HSTS)
  if (req.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    )
  }

  return response
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
