/**
 * Shared logic to detect tenant subdomain (e.g. zuha-stays.zuhahost.com).
 * Used by root layout (server) and must match middleware behavior.
 */
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "zuhahost.com";
const RESERVED_SUBDOMAINS = ["www", "app", "api", "dashboard"];

/**
 * Returns true if the given host is a tenant subdomain (e.g. zuha-stays.zuhahost.com)
 * and not a reserved subdomain. Used to hide dashboard on tenant public sites.
 * @param {string} host - Request host (e.g. from headers.get('host'))
 * @returns {boolean}
 */
export function isTenantSubdomain(host) {
  if (!host || typeof host !== "string") return false;
  const raw = host.split(":")[0].toLowerCase().trim();
  if (!raw.endsWith(`.${BASE_DOMAIN}`) && raw !== BASE_DOMAIN) return false;
  const parts = raw.split(".");
  if (parts.length < 3) return false;
  const subdomain = parts[0];
  return !RESERVED_SUBDOMAINS.includes(subdomain);
}
