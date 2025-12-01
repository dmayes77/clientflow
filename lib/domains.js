/**
 * Domain configuration for subdomain routing
 *
 * In production:
 *   - Marketing: getclientflow.app
 *   - Dashboard: dashboard.getclientflow.app
 *   - Admin: admin.getclientflow.app
 *
 * In development (localhost):
 *   - All routes accessible via localhost:3000
 *   - Use path-based routing: /dashboard, /admin
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'getclientflow.app'
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Get the full URL for a specific subdomain
 * @param {'marketing' | 'dashboard' | 'admin'} subdomain
 * @param {string} path - Path within that subdomain (e.g., '/settings')
 * @returns {string} Full URL
 */
export function getDomainUrl(subdomain, path = '') {
  // In development, use path-based routing
  if (!IS_PRODUCTION) {
    const basePath = subdomain === 'marketing' ? '' : `/${subdomain}`
    return `${basePath}${path}`
  }

  // In production, use subdomain routing
  const protocol = 'https'

  if (subdomain === 'marketing') {
    return `${protocol}://${ROOT_DOMAIN}${path}`
  }

  return `${protocol}://${subdomain}.${ROOT_DOMAIN}${path}`
}

/**
 * Get URLs for common destinations
 */
export const urls = {
  // Marketing site
  home: () => getDomainUrl('marketing', '/'),
  pricing: () => getDomainUrl('marketing', '/pricing'),
  documentation: () => getDomainUrl('marketing', '/documentation'),
  support: () => getDomainUrl('marketing', '/support'),
  signIn: () => getDomainUrl('marketing', '/sign-in'),
  signUp: () => getDomainUrl('marketing', '/sign-up'),

  // Dashboard
  dashboard: () => getDomainUrl('dashboard', '/'),
  dashboardBookings: () => getDomainUrl('dashboard', '/bookings'),
  dashboardClients: () => getDomainUrl('dashboard', '/clients'),
  dashboardServices: () => getDomainUrl('dashboard', '/services'),
  dashboardSettings: () => getDomainUrl('dashboard', '/settings'),

  // Admin
  admin: () => getDomainUrl('admin', '/'),
  adminTenants: () => getDomainUrl('admin', '/tenants'),
  adminSubscriptions: () => getDomainUrl('admin', '/subscriptions'),
  adminSettings: () => getDomainUrl('admin', '/settings'),
}

/**
 * Check if we're on a specific subdomain
 * @param {string} host - The host header value
 * @returns {'marketing' | 'dashboard' | 'admin' | null}
 */
export function getCurrentSubdomain(host) {
  if (!host) return null

  const hostname = host.split(':')[0]

  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return null // Use path-based routing in development
  }

  if (hostname.startsWith('dashboard.')) return 'dashboard'
  if (hostname.startsWith('admin.')) return 'admin'

  return 'marketing'
}

export default {
  ROOT_DOMAIN,
  IS_PRODUCTION,
  getDomainUrl,
  urls,
  getCurrentSubdomain,
}
