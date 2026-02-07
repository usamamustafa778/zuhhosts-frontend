import { NextResponse } from "next/server";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || "zuhahost.com";
const RESERVED_SUBDOMAINS = ["www", "app", "api", "dashboard"];

/**
 * Rewrite tenant subdomain requests to /public/[slug]
 * e.g. zuha-stays.zuhahost.com → /public/zuha-stays
 *      zuha-stays.zuhahost.com/property/123 → /public/zuha-stays/property/123
 */
export function middleware(request) {
  // Vercel/proxies may send x-forwarded-host; strip port from host
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(":")[0].toLowerCase().trim();

  const url = request.nextUrl.clone();

  // Only handle our base domain (e.g. zuhahost.com or *.zuhahost.com)
  if (!host.endsWith(`.${BASE_DOMAIN}`) && host !== BASE_DOMAIN) {
    return NextResponse.next();
  }

  const parts = host.split(".");
  // Tenant subdomain: zuha-stays.zuhahost.com → parts = ['zuha-stays', 'zuhahost', 'com']
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      return NextResponse.next();
    }
    // Rewrite to /public/[slug] and preserve path
    const slug = subdomain;
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
