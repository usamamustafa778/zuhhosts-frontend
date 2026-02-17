"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getPublicTenantInfo, getImageUrl } from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";
import { getTenantSlugFromSubdomain } from "@/utils/tenantUtils";
import { PublicSiteProvider } from "@/components/public/PublicSiteContext";
import PublicSiteLayout from "@/components/public/PublicSiteLayout";

export default function PublicSlugLayout({ children }) {
  const params = useParams();
  const subdomainSlug = getTenantSlugFromSubdomain();
  const slug = subdomainSlug || params?.slug;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [homeHref, setHomeHref] = useState(`/public/${slug}`);

  useEffect(() => {
    if (!slug) return;
    if (typeof window === "undefined") {
      setHomeHref(`/public/${slug}`);
      return;
    }

    const sub = getTenantSlugFromSubdomain();
    const hostname = window.location.hostname || "";
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "zuhahost.com";

    const isTenantSubdomain = Boolean(sub && sub === slug);
    const isCustomDomain =
      hostname &&
      hostname !== baseDomain &&
      !hostname.endsWith(`.${baseDomain}`) &&
      !hostname.startsWith("localhost") &&
      !hostname.startsWith("127.0.0.1") &&
      !hostname.startsWith("192.168.");

    // For tenant subdomains and custom domains, use root-relative URLs (/, /properties, etc.)
    // For dashboard/base domains, keep /public/[slug] in the path.
    if (isTenantSubdomain || isCustomDomain) {
      setHomeHref("/");
    } else {
      setHomeHref(`/public/${slug}`);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const tenantInfo = await getPublicTenantInfo(slug);
        setTenant(tenantInfo ?? null);
      } catch (err) {
        setError(err?.message || "Failed to load");
        setTenant(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading && !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <PageLoader message="Loading..." />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Website not available</h1>
          <p className="text-slate-600">This booking site is not found or not enabled.</p>
        </div>
      </div>
    );
  }

  const web = tenant.website ?? tenant.websiteConfig ?? {};
  const primaryColor = web.primaryColor || "#3b82f6";
  const logoUrl = getImageUrl(web.logo ?? web.logoUrl ?? "");
  const contactEmail = web.contactEmail ?? null;
  const contactPhone = web.contactPhone ?? null;

  const siteValue = {
    tenant,
    slug,
    homeHref,
    web,
    primaryColor,
    logoUrl,
    contactEmail,
    contactPhone,
  };

  return (
    <PublicSiteProvider value={siteValue}>
      <PublicSiteLayout
        tenant={tenant}
        slug={slug}
        homeHref={homeHref}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
      >
        {children}
      </PublicSiteLayout>
    </PublicSiteProvider>
  );
}
