"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPublicTenantInfo, getPublicProperties, getImageUrl } from "@/lib/api";
import PageLoader from "@/components/common/PageLoader";
import { getTenantSlugFromSubdomain } from "@/utils/tenantUtils";

export default function PublicLandingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomainSlug = getTenantSlugFromSubdomain();
  const slug = subdomainSlug || params?.slug;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const [tenantInfo, propertiesList] = await Promise.all([
          getPublicTenantInfo(slug),
          getPublicProperties(slug),
        ]);
        setTenant(tenantInfo ?? null);
        setProperties(Array.isArray(propertiesList) ? propertiesList : []);
      } catch (err) {
        setError(err?.message || "Failed to load");
        setTenant(null);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug]);

  if (isLoading) {
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

  // API may return website or websiteConfig (WEBSITE_API: website)
  const web = tenant.website ?? tenant.websiteConfig ?? {};
  const primaryColor = web.primaryColor || "#3b82f6";
  const logoUrl = getImageUrl(web.logo ?? web.logoUrl ?? "");
  const description = web.description || `Welcome to ${tenant.name}. Book your stay directly — best price, no commission.`;
  const contactEmail = web.contactEmail ?? null;
  const contactPhone = web.contactPhone ?? null;

  return (
    <div className="min-h-screen bg-white antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href={`/public/${slug}`} className="flex items-center gap-3 min-w-0">
            {logoUrl && (
              <img
                src={logoUrl}
                alt={tenant.name}
                className="h-11 w-11 rounded-xl object-contain shrink-0 border border-slate-100"
              />
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-slate-900 truncate">{tenant.name}</h1>
              {tenant.country && (
                <p className="text-xs text-slate-500 truncate">{tenant.country}</p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-4 shrink-0">
            {contactPhone && (
              <a
                href={`tel:${contactPhone.replace(/\s/g, "")}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span className="text-slate-400">📞</span> {contactPhone}
              </a>
            )}
            {contactEmail && (
              <a
                href={`mailto:${contactEmail}`}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <span className="text-slate-400">✉️</span> {contactEmail}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}04 50%, transparent 100%)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4 max-w-3xl mx-auto leading-tight">
            {description}
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
            Book direct. Zero commission. Instant confirmation.
          </p>
          <a
            href="#properties"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white shadow-lg hover:opacity-95 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            View our properties
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 text-slate-600 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Best price guaranteed
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> No booking fees
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Instant confirmation
            </span>
          </div>
        </div>
      </section>

      {/* Properties */}
      <section id="properties" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
          Our properties
          {properties.length > 0 && (
            <span className="text-slate-500 font-normal text-lg ml-2">({properties.length})</span>
          )}
        </h3>

        {properties.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 7l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No properties available right now.</p>
            <p className="text-slate-500 text-sm mt-1">Check back soon.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {properties.map((property) => {
              const id = property.id ?? property._id;
              const images = property.images ?? property.photos ?? [];
              const firstImage = images[0] ?? property.image ?? property.photo;
              const imgSrc = getImageUrl(firstImage);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => router.push(`/public/${slug}/property/${id}`)}
                  className="group text-left rounded-2xl border border-slate-200 overflow-hidden bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={property.title ?? "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.style.display = "none";
                          const placeholder = e.currentTarget.nextElementSibling;
                          if (placeholder) placeholder.classList.remove("hidden");
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center text-slate-300 ${imgSrc ? "hidden" : ""}`}>
                      <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    {images.length > 1 && (
                      <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                        +{images.length - 1}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-semibold text-slate-900 mb-1 group-hover:underline decoration-2 underline-offset-2">
                      {property.title}
                    </h4>
                    {property.location && (
                      <p className="text-sm text-slate-500 mb-3 truncate">{property.location}</p>
                    )}
                    <div className="flex items-end justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {property.bedrooms > 0 && (
                          <span>🛏️ {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""}</span>
                        )}
                        {property.bathrooms > 0 && (
                          <span>🚿 {property.bathrooms} bath{property.bathrooms !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold" style={{ color: primaryColor }}>
                          {property.price != null ? `$${Number(property.price).toLocaleString()}` : "—"}
                        </span>
                        <span className="text-xs text-slate-500 ml-0.5">/ night</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-slate-900">© {new Date().getFullYear()} {tenant.name}</p>
            {(contactEmail || contactPhone) && (
              <p className="text-sm text-slate-500 mt-1">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="hover:text-slate-700 underline-offset-2 hover:underline">
                    {contactEmail}
                  </a>
                )}
                {contactEmail && contactPhone && " · "}
                {contactPhone && (
                  <a href={`tel:${contactPhone.replace(/\s/g, "")}`} className="hover:text-slate-700 underline-offset-2 hover:underline">
                    {contactPhone}
                  </a>
                )}
              </p>
            )}
          </div>
          <p className="text-sm text-slate-400">
            Powered by{" "}
            <a href="https://zuhahost.com" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-slate-900 font-medium">
              Zuha Host
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
