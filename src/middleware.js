import { NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "zuhahost.com";
const RESERVED_SUBDOMAINS = ["www", "app", "api", "dashboard"];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://zuhahosts-backend.onrender.com";

/**
 * Resolve custom domain to tenant slug via backend.
 * Backend: GET /api/tenants/resolve-domain?host=marriott.com → { slug: "marriott" }
 */
async function resolveCustomDomain(host) {
  try {
    const base = API_BASE.replace(/\/$/, "");
    const res = await fetch(
      `${base}/api/tenants/resolve-domain?host=${encodeURIComponent(host)}`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.slug ?? data?.data?.slug ?? null;
  } catch {
    return null;
  }
}

/**
 * Rewrite tenant subdomain or custom domain requests to /public/[slug]
 * - zuha-stays.zuhahost.com → /public/zuha-stays
 * - marriott.com (custom domain) → resolve slug from DB, then /public/marriott
 */
export async function middleware(request) {
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase().trim();
  const url = request.nextUrl.clone();

  // Our base domain: subdomain routing
  if (host.endsWith(`.${BASE_DOMAIN}`) || host === BASE_DOMAIN) {
    const parts = host.split(".");
    if (parts.length >= 3) {
      const subdomain = parts[0].toLowerCase();
      if (RESERVED_SUBDOMAINS.includes(subdomain)) {
        return NextResponse.next();
      }
      const path = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/public/${subdomain}${path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Localhost / dev: no custom-domain resolution
  if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.")) {
    return NextResponse.next();
  }

  // Custom domain: resolve tenant slug from backend and rewrite to /public/[slug]
  const slug = await resolveCustomDomain(host);
  if (slug) {
    const path = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/public/${slug}${path}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static assets and Next internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)",
  ],
};
