/**
 * Tenant Utilities
 * 
 * Functions for handling tenant slug detection from subdomains and routes
 */

/**
 * Get tenant slug from subdomain or URL
 * 
 * Examples:
 * - sunrise-hotel.zuhahost.com → "sunrise-hotel"
 * - localhost:3000?tenant=sunrise-hotel → "sunrise-hotel"
 * - /public/sunrise-hotel → handled by Next.js routing
 * 
 * @param {string} fallback - Fallback slug if none detected (for dev)
 * @returns {string|null} Tenant slug
 */
export const getTenantSlugFromSubdomain = (fallback = null) => {
  if (typeof window === 'undefined') return fallback; // SSR

  const hostname = window.location.hostname;

  // Production: subdomain.zuhahost.com
  if (hostname.endsWith('.zuhahost.com')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0]; // "sunrise-hotel" from "sunrise-hotel.zuhahost.com"
    }
  }

  // Local dev with .local domain: sunrise-hotel.zuhahost.local
  if (hostname.endsWith('.zuhahost.local')) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
  }

  // Local dev: localhost or 127.0.0.1 — use query param
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
    const params = new URLSearchParams(window.location.search);
    const tenantParam = params.get('tenant');
    if (tenantParam) return tenantParam;
  }

  return fallback;
};

/**
 * Get tenant slug from server-side request (Next.js)
 * Use in getServerSideProps or middleware
 * 
 * @param {Object} req - Next.js request object
 * @param {Object} query - Next.js query object
 * @returns {string|null} Tenant slug
 */
export const getTenantSlugFromRequest = (req, query = {}) => {
  const host = req.headers.host || '';
  
  // Check if it's localhost or local IP
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.startsWith('192.168.')) {
    // Use query param for local dev
    return query.tenant || null;
  }

  // Production: extract subdomain from host
  // e.g., sunrise-hotel.zuhahost.com → "sunrise-hotel"
  if (host.endsWith('.zuhahost.com') || host.endsWith('.zuhahost.local')) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      return parts[0];
    }
  }

  return null;
};

/**
 * Check if current environment supports subdomains
 * @returns {boolean}
 */
export const isSubdomainEnvironment = () => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.endsWith('.zuhahost.com') || hostname.endsWith('.zuhahost.local');
};

/**
 * Build public website URL for a tenant
 * @param {string} slug - Tenant slug
 * @param {boolean} useSubdomain - Whether to use subdomain (default: true in production)
 * @returns {string} Full URL
 */
export const buildTenantWebsiteUrl = (slug, useSubdomain = true) => {
  if (typeof window === 'undefined') {
    // SSR: return relative path
    return `/public/${slug}`;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;

  // In production or if explicitly using subdomain
  if (useSubdomain && (hostname.endsWith('.zuhahost.com') || hostname.endsWith('.zuhahost.local'))) {
    const baseDomain = hostname.endsWith('.zuhahost.com') ? 'zuhahost.com' : 'zuhahost.local';
    const portStr = port && port !== '80' && port !== '443' ? `:${port}` : '';
    return `${protocol}//${slug}.${baseDomain}${portStr}`;
  }

  // Local dev: use route-based URL
  return `${protocol}//${hostname}${port ? ':' + port : ''}/public/${slug}`;
};

/**
 * Validate tenant slug format
 * Must be lowercase, alphanumeric, hyphens only
 * @param {string} slug
 * @returns {boolean}
 */
export const isValidTenantSlug = (slug) => {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
};

/**
 * Generate slug from tenant name
 * "Sunrise Hotel" → "sunrise-hotel"
 * @param {string} name
 * @returns {string}
 */
export const generateSlugFromName = (name) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};
